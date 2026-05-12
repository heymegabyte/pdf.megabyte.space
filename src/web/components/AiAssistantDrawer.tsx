import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Send, Plus, Copy, Check, Square, Trash2, Download, MessageSquare, Command } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { captureEvent } from "../lib/analytics";
import { useAuth } from "../lib/auth";

const STORAGE_KEY = "mpdf.assistant.threads.v1";
const ACTIVE_KEY = "mpdf.assistant.active.v1";
const MAX_THREADS = 12;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface Thread {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface ThreadStore {
  threads: Record<string, Thread>;
  order: string[];
}

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadStore(): ThreadStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ThreadStore;
      if (parsed && typeof parsed === "object" && parsed.threads && parsed.order) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { threads: {}, order: [] };
}

function saveStore(store: ThreadStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore — private mode / quota */
  }
}

const SUGGESTIONS = [
  "Draft a one-page invoice for $4,500 of design work",
  "Make a two-column resume for a senior backend engineer",
  "Write a one-page client proposal for a logo redesign",
  "Add a table of contents to my document",
  "Suggest 3 layouts for a quarterly report cover",
];

const SLASH_COMMANDS: { cmd: string; desc: string }[] = [
  { cmd: "/new", desc: "Start a new thread" },
  { cmd: "/clear", desc: "Clear current thread" },
  { cmd: "/export", desc: "Download thread as markdown" },
  { cmd: "/help", desc: "List commands" },
];

function renderMarkdown(text: string): { html: string; codeBlocks: string[] } {
  const codeBlocks: string[] = [];
  let html = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push(code);
    const idx = codeBlocks.length - 1;
    return `<pre data-code-idx="${idx}" data-lang="${lang || "text"}"><code>${escapeHtml(code)}</code></pre>`;
  });
  html = html.replace(/`([^`\n]+)`/g, (_, c) => `<code class="inline">${escapeHtml(c)}</code>`);
  html = html
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html
    .split(/\n\n+/)
    .map((para) => {
      if (para.startsWith("<pre")) return para;
      const lines = para.split("\n");
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${l.replace(/^\s*[-*]\s+/, "")}</li>`).join("")}</ul>`;
      }
      if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
        return `<ol>${lines.map((l) => `<li>${l.replace(/^\s*\d+\.\s+/, "")}</li>`).join("")}</ol>`;
      }
      return `<p>${para.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");
  return { html, codeBlocks };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

function threadTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New thread";
  return first.content.slice(0, 60).replace(/\s+/g, " ").trim();
}

export function AiAssistantDrawer() {
  const [open, setOpen] = useState(false);
  const [store, setStore] = useState<ThreadStore>(() => loadStore());
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [showThreads, setShowThreads] = useState(false);

  const drawerRef = useFocusTrap<HTMLDivElement>();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoScrollRef = useRef(true);

  const { status, me } = useAuth();

  const activeThread = activeId ? store.threads[activeId] : null;
  const messages = activeThread?.messages ?? [];

  const persist = useCallback((next: ThreadStore) => {
    setStore(next);
    saveStore(next);
  }, []);

  const setActive = useCallback((id: string | null) => {
    setActiveId(id);
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const ensureActiveThread = useCallback((): { id: string; next: ThreadStore } => {
    if (activeId && store.threads[activeId]) return { id: activeId, next: store };
    const id = newId();
    const thread: Thread = { id, title: "New thread", messages: [], updatedAt: Date.now() };
    const order = [id, ...store.order].slice(0, MAX_THREADS);
    const next: ThreadStore = { threads: { ...store.threads, [id]: thread }, order };
    persist(next);
    setActive(id);
    return { id, next };
  }, [activeId, store, persist, setActive]);

  const startNewThread = useCallback(() => {
    const id = newId();
    const thread: Thread = { id, title: "New thread", messages: [], updatedAt: Date.now() };
    const order = [id, ...store.order].slice(0, MAX_THREADS);
    persist({ threads: { ...store.threads, [id]: thread }, order });
    setActive(id);
    setInput("");
    setError(null);
    setStreamingText("");
    captureEvent("assistant_thread_new", {});
  }, [store, persist, setActive]);

  const clearActive = useCallback(() => {
    if (!activeId) return;
    const t = store.threads[activeId];
    if (!t) return;
    const next: ThreadStore = {
      threads: { ...store.threads, [activeId]: { ...t, messages: [], title: "New thread", updatedAt: Date.now() } },
      order: store.order,
    };
    persist(next);
    setStreamingText("");
    setError(null);
  }, [activeId, store, persist]);

  const deleteThread = useCallback(
    (id: string) => {
      const { [id]: _drop, ...rest } = store.threads;
      void _drop;
      const order = store.order.filter((x) => x !== id);
      persist({ threads: rest, order });
      if (activeId === id) setActive(order[0] ?? null);
    },
    [store, persist, activeId, setActive]
  );

  const exportMarkdown = useCallback(() => {
    if (!activeThread) return;
    const md = activeThread.messages
      .map((m) => `### ${m.role === "user" ? "You" : "Megabyte Assist"}\n\n${m.content}\n`)
      .join("\n");
    const blob = new Blob([`# ${activeThread.title}\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `megabyte-assist-${activeThread.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    captureEvent("assistant_export", {});
  }, [activeThread]);

  const runSlash = useCallback(
    (cmd: string): boolean => {
      const trimmed = cmd.trim();
      if (!trimmed.startsWith("/")) return false;
      const head = trimmed.split(" ")[0]!.toLowerCase();
      if (head === "/new") {
        startNewThread();
        return true;
      }
      if (head === "/clear") {
        clearActive();
        return true;
      }
      if (head === "/export") {
        exportMarkdown();
        return true;
      }
      if (head === "/help") {
        const help = SLASH_COMMANDS.map((s) => `**${s.cmd}** — ${s.desc}`).join("\n");
        const { id, next } = ensureActiveThread();
        const t = next.threads[id]!;
        const helpMsg: Message = { id: newId(), role: "assistant", content: help, ts: Date.now() };
        persist({
          threads: { ...next.threads, [id]: { ...t, messages: [...t.messages, helpMsg], updatedAt: Date.now() } },
          order: next.order,
        });
        return true;
      }
      return false;
    },
    [startNewThread, clearActive, exportMarkdown, ensureActiveThread, persist]
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streaming) return;
      if (runSlash(text)) {
        setInput("");
        return;
      }

      const { id: tid, next: storeAfterEnsure } = ensureActiveThread();
      const userMsg: Message = { id: newId(), role: "user", content: text, ts: Date.now() };
      const baseThread = storeAfterEnsure.threads[tid]!;
      const withUser: Thread = {
        ...baseThread,
        messages: [...baseThread.messages, userMsg],
        title: baseThread.messages.length === 0 ? threadTitle([userMsg]) : baseThread.title,
        updatedAt: Date.now(),
      };
      let nextStore: ThreadStore = {
        threads: { ...storeAfterEnsure.threads, [tid]: withUser },
        order: storeAfterEnsure.order,
      };
      persist(nextStore);
      setInput("");
      setError(null);
      setStreaming(true);
      setStreamingText("");
      captureEvent("assistant_send", { thread: tid, plan: me?.user.plan ?? "anon" });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const payload = {
          messages: withUser.messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
          thread: tid,
        };
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error((errBody as { error?: string }).error || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            let event = "message";
            let data = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event: ")) event = line.slice(7);
              else if (line.startsWith("data: ")) data = line.slice(6);
            }
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (event === "token") {
                assistantText += parsed.text as string;
                setStreamingText(assistantText);
              } else if (event === "done") {
                setQuotaRemaining(parsed.remaining as number);
              } else if (event === "error") {
                throw new Error(parsed.message as string);
              }
            } catch {
              /* ignore bad frame */
            }
          }
        }

        const assistantMsg: Message = {
          id: newId(),
          role: "assistant",
          content: assistantText || "(no response)",
          ts: Date.now(),
        };
        const persistedThread = nextStore.threads[tid]!;
        const finalThread: Thread = {
          ...persistedThread,
          messages: [...persistedThread.messages, assistantMsg],
          updatedAt: Date.now(),
        };
        persist({
          threads: { ...nextStore.threads, [tid]: finalThread },
          order: nextStore.order,
        });
        setStreamingText("");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          if (streamingText) {
            const persistedThread = nextStore.threads[tid]!;
            const stoppedMsg: Message = {
              id: newId(),
              role: "assistant",
              content: streamingText + "\n\n_(stopped)_",
              ts: Date.now(),
            };
            const finalThread: Thread = {
              ...persistedThread,
              messages: [...persistedThread.messages, stoppedMsg],
              updatedAt: Date.now(),
            };
            persist({
              threads: { ...nextStore.threads, [tid]: finalThread },
              order: nextStore.order,
            });
          }
          setStreamingText("");
        } else {
          setError((err as Error).message || "Request failed");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, streamingText, runSlash, ensureActiveThread, persist, me]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Cmd/Ctrl+K toggle, Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isOpenShortcut = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (isOpenShortcut) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  // Smart auto-scroll: only stick to bottom if user is near the bottom
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      autoScrollRef.current = dist < 80;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (!el || !autoScrollRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, streamingText, open]);

  // Slash hint when typing /
  useEffect(() => {
    setShowSlash(input.startsWith("/") && !input.includes(" "));
  }, [input]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }, [input]);

  const onInputKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const planLabel = useMemo(() => {
    if (status !== "authenticated") return "Anon";
    if (me?.user.plan === "unlimited") return "Unlimited";
    if (me?.user.plan === "pro") return "Pro";
    return "Free";
  }, [status, me]);

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        aria-label="Open AI assistant"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => {
          setOpen(true);
          captureEvent("assistant_open", { source: "launcher" });
        }}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 h-12 rounded-full bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-blue)] text-[#060610] font-semibold text-sm shadow-[0_10px_40px_-10px_rgba(0,229,255,0.6)] hover:shadow-[0_14px_48px_-8px_rgba(0,229,255,0.8)] transition-shadow"
        style={{ display: open ? "none" : undefined }}
      >
        <Sparkles size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Ask Megabyte</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/15 ml-1">
          <Command size={10} aria-hidden="true" />K
        </kbd>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_180ms_ease-out]"
        />
      )}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-heading"
        className={`fixed top-0 right-0 z-50 h-[100dvh] w-full sm:w-[440px] bg-[var(--color-bg-elev)] border-l border-[var(--color-line)] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <header className="px-4 py-3 border-b border-[var(--color-line)] flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--color-cyan)]" aria-hidden="true" />
          <h2 id="assistant-heading" className="font-semibold text-sm flex-1">
            Megabyte Assist
            <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-mono">{planLabel}</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowThreads((v) => !v)}
            aria-label="Threads"
            aria-expanded={showThreads}
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-cyan)] hover:bg-white/[0.04] transition-colors"
            title="Threads"
          >
            <MessageSquare size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={startNewThread}
            aria-label="New thread"
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-cyan)] hover:bg-white/[0.04] transition-colors"
            title="New thread"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={exportMarkdown}
            aria-label="Export thread as markdown"
            disabled={!activeThread || activeThread.messages.length === 0}
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-cyan)] hover:bg-white/[0.04] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Export markdown"
          >
            <Download size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-white/[0.04] transition-colors"
            title="Close (Esc)"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {showThreads && (
          <div className="px-2 py-2 border-b border-[var(--color-line)] max-h-48 overflow-y-auto">
            {store.order.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] px-2 py-1">No threads yet.</p>
            ) : (
              store.order
                .map((id) => store.threads[id])
                .filter((t): t is Thread => Boolean(t))
                .map((t) => (
                  <div key={t.id} className="flex items-center gap-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActive(t.id);
                        setShowThreads(false);
                      }}
                      className={`flex-1 text-left px-2 py-1.5 rounded text-xs truncate hover:bg-white/[0.04] ${
                        activeId === t.id ? "text-[var(--color-cyan)]" : "text-[var(--color-fg)]"
                      }`}
                    >
                      {t.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteThread(t.id)}
                      aria-label={`Delete ${t.title}`}
                      className="p-1 rounded text-[var(--color-muted)] hover:text-red-400"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </div>
                ))
            )}
          </div>
        )}

        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 && !streamingText && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-sm text-[var(--color-fg)]">
                  Ask anything about <strong>Megabyte PDF</strong> — drafting a document, exporting a real PDF, picking the right plan, or boosting your prompts.
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-2">
                  Tip: type <code className="font-mono text-[var(--color-cyan)]">/help</code> for commands.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold">Try one</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    className="block w-full text-left px-3 py-2 rounded-md text-xs bg-white/[0.03] hover:bg-white/[0.06] border border-[var(--color-line)] hover:border-[var(--color-cyan)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {streamingText && (
            <MessageBubble message={{ id: "streaming", role: "assistant", content: streamingText, ts: Date.now() }} streaming />
          )}

          {streaming && !streamingText && (
            <div className="flex items-center gap-1.5 text-[var(--color-muted)] text-xs">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse [animation-delay:120ms]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse [animation-delay:240ms]" />
              <span className="ml-1">thinking…</span>
            </div>
          )}

          {error && (
            <div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="border-t border-[var(--color-line)] p-3 relative"
        >
          {showSlash && (
            <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)] shadow-lg overflow-hidden">
              {SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input)).map((c) => (
                <button
                  key={c.cmd}
                  type="button"
                  onClick={() => {
                    setInput(c.cmd + " ");
                    inputRef.current?.focus();
                  }}
                  className="block w-full text-left px-3 py-2 text-xs hover:bg-white/[0.05]"
                >
                  <span className="font-mono text-[var(--color-cyan)]">{c.cmd}</span>
                  <span className="ml-2 text-[var(--color-muted)]">{c.desc}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Ask Megabyte… (Enter to send, Shift+Enter newline)"
              rows={1}
              className="flex-1 resize-none bg-[var(--color-bg)] border border-[var(--color-line)] focus:border-[var(--color-cyan)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-muted)] outline-none transition-colors"
              style={{ maxHeight: 160 }}
              aria-label="Message"
              disabled={streaming}
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop generation"
                className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 transition-colors"
                title="Stop"
              >
                <Square size={14} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-cyan)] text-[#060610] hover:bg-[var(--color-blue)] disabled:opacity-30 disabled:hover:bg-[var(--color-cyan)] transition-colors"
                title="Send (Enter)"
              >
                <Send size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-[var(--color-muted)]">
            <span>
              {planLabel === "Anon" ? (
                <>
                  Sign in for higher limits ·{" "}
                  <a href="/sign-in" className="text-[var(--color-cyan)] hover:underline">
                    Sign in
                  </a>
                </>
              ) : quotaRemaining !== null ? (
                <>{quotaRemaining} messages left today</>
              ) : (
                <>Powered by Claude · Megabyte AI</>
              )}
            </span>
            {input.length > 0 && <span className="font-mono">{input.length} ch</span>}
          </div>
        </form>
      </aside>
    </>
  );
}

function MessageBubble({ message, streaming }: { message: Message; streaming?: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const rendered = useMemo(() => renderMarkdown(message.content), [message.content]);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [message.content]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group max-w-[90%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--color-cyan)] text-[#060610] rounded-br-sm"
            : "bg-white/[0.04] border border-[var(--color-line)] rounded-bl-sm text-[var(--color-fg)]"
        }`}
      >
        <div
          className="assist-md"
          dangerouslySetInnerHTML={{ __html: rendered.html }}
        />
        {!isUser && !streaming && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy message"}
              className="inline-flex items-center gap-1 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-cyan)]"
            >
              {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
