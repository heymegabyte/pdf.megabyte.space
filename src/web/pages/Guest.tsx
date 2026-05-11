import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  Code2,
  Download,
  Share2,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  LogIn,
  Save,
  Lock,
  Printer,
} from "lucide-react";
import { buildPreviewDoc } from "../lib/preview";
import { Logo } from "../components/Logo";
const CodePanel = lazy(() => import("../components/CodePanel").then((m) => ({ default: m.CodePanel })));
import { useConfig } from "../lib/config";
import { captureEvent } from "../lib/analytics";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface GuestTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface GuestState {
  title: string;
  html: string;
  css: string;
  pageSize: "Letter" | "A4" | "Legal";
  margin: string;
  turns: GuestTurn[];
  updatedAt: number;
}

const STORAGE_KEY = "megabyte-pdf:guest:v1";
const IMPORT_KEY = "megabyte-pdf:import-guest";

const STARTER_HTML = `<article>
  <header>
    <h1>Untitled Document</h1>
    <p class="subtitle">A blank canvas. Ask the chat to make it yours.</p>
  </header>
  <section>
    <p>Type a prompt — "build me a one-page resume for a senior engineer named Alex Rivera" or "create a quarterly business report template" — and watch this preview update in real time.</p>
    <p>Each printed page wraps automatically at 8.5 × 11 inches.</p>
  </section>
</article>`;

const STARTER_CSS = `body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
  line-height: 1.6;
  font-size: 11pt;
}
h1 { font-size: 28pt; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 0.25em; color: #060610; }
.subtitle { color: #6b7280; font-size: 12pt; margin: 0 0 2em; }
section p { margin: 0 0 1em; }`;

function loadState(): GuestState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as GuestState;
    if (!parsed.html || !parsed.css) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function defaultState(): GuestState {
  return {
    title: "Untitled Document",
    html: STARTER_HTML,
    css: STARTER_CSS,
    pageSize: "Letter",
    margin: "0.75in",
    turns: [],
    updatedAt: Date.now(),
  };
}

function saveState(state: GuestState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

interface ChatResponse {
  reply: string;
  rawText: string;
  html?: string;
  css?: string;
  quota: { limit: number; used: number };
}

export default function Guest() {
  useDocumentTitle("Try free — Build a PDF with AI in seconds");
  const config = useConfig();
  const authConfigured = Boolean(config?.googleSignInEnabled);
  const [state, setState] = useState<GuestState>(() => loadState());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [previewPages, setPreviewPages] = useState(1);
  const [signInPrompt, setSignInPrompt] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ limit: number; used: number } | null>(null);
  const [localCode, setLocalCode] = useState<{ html: string; css: string } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const liveHtmlRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "preview:rendered" && typeof e.data.pages === "number") {
        setPreviewPages(e.data.pages);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [state.turns.length, sending]);

  useEffect(() => {
    fetch("/api/guest/quota")
      .then((r) => (r.ok ? (r.json() as Promise<{ limit: number; used: number }>) : null))
      .then((q) => q && setQuota(q))
      .catch(() => {});
  }, []);

  // Inline contentEditable editing — re-enabled on each iframe load
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    function onLoad() {
      liveHtmlRef.current = null;
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      doc.querySelectorAll<HTMLElement>(".page").forEach((page) => {
        page.contentEditable = "true";
        page.style.cursor = "text";
      });
      doc.addEventListener("input", () => {
        const parts: string[] = [];
        doc.querySelectorAll<HTMLElement>(".page").forEach((page) => {
          const clone = page.cloneNode(true) as Element;
          clone.querySelectorAll("[data-pn]").forEach((el) => el.remove());
          parts.push(clone.innerHTML.trim());
        });
        liveHtmlRef.current = parts.join('\n<div class="page-break"></div>\n');
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
          const html = liveHtmlRef.current;
          if (!html) return;
          liveHtmlRef.current = null;
          setState((s) => ({ ...s, html, updatedAt: Date.now() }));
        }, 2000);
      });
    }
    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => iframe.removeEventListener("load", onLoad);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [message]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "\\") { e.preventDefault(); setShowCode((s) => !s); }
      if (meta && e.key === "p") { e.preventDefault(); iframeRef.current?.contentWindow?.print(); }
      if (e.key === "Escape" && showCode) { setShowCode(false); setLocalCode(null); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showCode]);

  const previewSrc = useMemo(() => {
    const h = localCode?.html ?? state.html;
    const c = localCode?.css ?? state.css;
    return buildPreviewDoc(h, c, state.pageSize, state.margin);
  }, [localCode, state.html, state.css, state.pageSize, state.margin]);

  const send = useCallback(async () => {
    const text = message.trim();
    if (!text || sending) return;
    // Flush pending inline edits so AI sees latest content
    const pendingHtml = liveHtmlRef.current;
    if (pendingHtml) {
      liveHtmlRef.current = null;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      setState((s) => ({ ...s, html: pendingHtml, updatedAt: Date.now() }));
    }
    setSending(true);
    setError(null);
    setMessage("");
    const userTurn: GuestTurn = {
      id: `g-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, turns: [...s.turns, userTurn] }));
    captureEvent("guest_chat_send");
    try {
      const history = state.turns.slice(-10).map((t) => ({
        role: t.role,
        content: t.content,
      }));
      const res = await fetch("/api/guest/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          html: pendingHtml ?? state.html,
          css: state.css,
          pageSize: state.pageSize,
          margin: state.margin,
          history,
        }),
      });
      const body = (await res.json()) as ChatResponse & { error?: string; code?: string };
      if (!res.ok) {
        if (body.code === "GUEST_LIMIT") {
          captureEvent("guest_quota_hit");
          setSignInPrompt("You've used today's free guest quota. Sign in for higher limits.");
        }
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setQuota(body.quota);
      const assistantTurn: GuestTurn = {
        id: `g-${Date.now() + 1}`,
        role: "assistant",
        content: body.rawText,
        createdAt: Date.now(),
      };
      setLocalCode(null); // AI response supersedes local code edits
      setState((s) => ({
        ...s,
        html: body.html ?? s.html,
        css: body.css ?? s.css,
        turns: [...s.turns, assistantTurn],
        updatedAt: Date.now(),
      }));
      captureEvent("guest_chat_reply", { hasHtml: Boolean(body.html) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
      setState((s) => ({ ...s, turns: s.turns.filter((t) => t.id !== userTurn.id) }));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [message, sending, state.css, state.html, state.margin, state.pageSize, state.turns]);

  function reset() {
    if (!confirm("Discard this guest document and start over?")) return;
    captureEvent("guest_reset");
    setState(defaultState());
    setMessage("");
    setError(null);
  }

  function gateFeature(feature: string) {
    captureEvent("guest_feature_gate", { feature });
    captureEvent("guest_signin_prompt_shown", { reason: feature });
    setSignInPrompt(`Sign in to ${feature}.`);
  }

  const remaining = quota ? Math.max(0, quota.limit - quota.used) : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="px-3 sm:px-4 py-2 border-b border-[var(--color-line)] flex items-center gap-2 bg-[var(--color-bg)] shrink-0">
        <Link
          to="/"
          className="btn btn-ghost text-xs px-2 py-1.5 shrink-0"
          aria-label="Home"
          style={{ minHeight: 36, minWidth: 36 }}
        >
          <ArrowLeft size={14} />
        </Link>
        <Logo size={28} />
        <span className="ml-1 text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border border-[var(--color-cyan)]/30 text-[var(--color-cyan)] bg-[var(--color-cyan)]/5 shrink-0">
          Guest
        </span>
        <input
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
          className="input flex-1 max-w-sm font-medium text-sm py-1.5 ml-1"
          aria-label="Document title"
          maxLength={80}
        />
        <select
          value={state.pageSize}
          onChange={(e) =>
            setState((s) => ({ ...s, pageSize: e.target.value as GuestState["pageSize"] }))
          }
          className="input text-xs py-1.5 w-auto"
          aria-label="Page size"
        >
          <option value="Letter">Letter</option>
          <option value="A4">A4</option>
          <option value="Legal">Legal</option>
        </select>
        <select
          value={state.margin}
          onChange={(e) => setState((s) => ({ ...s, margin: e.target.value }))}
          className="input text-xs py-1.5 w-auto hidden sm:block"
          aria-label="Page margin"
        >
          <option value="0.5in">Narrow</option>
          <option value="0.75in">Normal</option>
          <option value="1in">Wide</option>
          <option value="1.25in">Extra wide</option>
        </select>
        <div className="flex-1" />
        {remaining !== null && (
          <span
            role="status"
            aria-live="polite"
            className="text-[11px] text-[var(--color-muted)] tabular-nums"
            title={`Used ${quota?.used ?? 0} of ${quota?.limit ?? 0} guest prompts today`}
          >
            {remaining} prompts left
          </span>
        )}
        <button
          onClick={() => setShowCode((s) => !s)}
          className="btn btn-ghost text-xs px-3 py-1.5"
          style={{
            minHeight: 36,
            ...(showCode && {
              backgroundColor: "rgba(0, 229, 255, 0.1)",
              borderColor: "rgba(0, 229, 255, 0.6)",
              color: "var(--color-cyan)",
            }),
          }}
          aria-label="Toggle code editor"
          aria-pressed={showCode}
        >
          <Code2 size={14} />
          <span className="hidden sm:inline">Code</span>
        </button>
        <button
          onClick={() => gateFeature("save your work")}
          className="btn btn-ghost text-xs px-3 py-1.5"
          style={{ minHeight: 36 }}
          aria-label="Save (sign in required)"
        >
          <Save size={14} />
          <span className="hidden sm:inline">Save</span>
        </button>
        <button
          onClick={() => gateFeature("download a real PDF")}
          className="btn btn-primary text-xs px-3 py-1.5"
          style={{ minHeight: 36 }}
          aria-label="Download PDF (sign in required)"
        >
          <Download size={14} />
          <span className="hidden sm:inline">PDF</span>
        </button>
      </header>

      {error && (
        <div role="alert" aria-live="assertive" className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] overflow-hidden">
        <aside className="border-r border-[var(--color-line)] flex flex-col bg-[var(--color-bg-elev)] min-h-0">
          <div
            ref={chatScrollRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3"
            data-testid="guest-chat-scroll"
          >
            {state.turns.length === 0 && !sending && (
              <div className="text-center py-8 px-2">
                <Sparkles size={24} className="mx-auto mb-3 text-[var(--color-cyan)]" />
                <p className="text-sm text-[var(--color-muted)] mb-1">
                  Try the chat. No signup, no email.
                </p>
                <p className="text-[11px] text-[var(--color-muted)]/70 mb-3">
                  {quota?.limit ?? 10} free prompts a day. Sign in for more.
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    "Invoice for $4,200 to Acme Corp from Brian Z, due in 14 days",
                    "One-page resume for a senior software engineer in New York",
                    "Mutual NDA between two startups — clean, professional, 2 pages",
                    "Cover letter for a product designer applying to a Series A startup",
                    "Quarterly business report with KPIs, highlights, and next-quarter goals",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setMessage(s); captureEvent("guest_starter_prompt", { prompt: s }); setTimeout(() => textareaRef.current?.focus(), 0); }}
                      className="text-xs text-left p-2 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-cyan)]/40 hover:bg-white/[0.02] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {state.turns.map((turn) => (
              <ChatMessage key={turn.id} turn={turn} />
            ))}
            {sending && (
              <div className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                <Loader2 size={16} className="animate-spin mt-1 text-[var(--color-cyan)]" />
                <span>Drawing your document…</span>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-line)] p-3 bg-[var(--color-bg)]">
            <div className="flex items-center gap-2 mb-2" role="radiogroup" aria-label="AI model">
              <span className="text-xs text-[var(--color-muted)]">Model:</span>
              <button
                role="radio"
                aria-checked={true}
                className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] border border-[var(--color-cyan)]/40"
                disabled
                aria-label="Sonnet model (active)"
              >
                Sonnet
              </button>
              <button
                role="radio"
                aria-checked={false}
                onClick={() => gateFeature("use the Opus model — create a Pro account")}
                className="text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1 border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                aria-label="Opus model — sign in required"
              >
                <Lock size={10} />
                Opus
              </button>
              <div className="flex-1" />
              <button
                onClick={reset}
                className="text-xs text-[var(--color-muted)] underline-hover"
                aria-label="Start over"
              >
                Reset
              </button>
            </div>
            <div className="relative">
              {remaining !== null && remaining <= 3 && remaining > 0 && (
                <p className="text-[11px] text-amber-400 mb-2">
                  {remaining} prompt{remaining === 1 ? "" : "s"} left today.{" "}
                  <Link to="/sign-in" className="underline underline-offset-2" onClick={() => captureEvent("guest_low_quota_signup")}>
                    Sign in for more
                  </Link>
                </p>
              )}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Describe a document… (⌘+Enter)"
                aria-label="Chat message"
                className="input resize-none pr-12 pb-6 text-sm"
                style={{ minHeight: 56, maxHeight: 180, overflowY: "auto" }}
                disabled={sending}
                maxLength={4000}
                data-testid="guest-prompt"
              />
              <span className="absolute bottom-2 left-3 text-[10px] text-[var(--color-muted)] pointer-events-none select-none">
                {message.length > 0 && `${message.length}/4000`}
              </span>
              <button
                onClick={send}
                disabled={!message.trim() || sending}
                className="absolute bottom-2 right-2 size-9 rounded-lg bg-[var(--color-cyan)] text-[#060610] grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                aria-label="Send"
                data-testid="guest-send"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </aside>

        <main id="main-content" className="flex flex-col min-h-0 overflow-hidden bg-[#1a1a24] relative">
          <div className="px-4 py-2 border-b border-[var(--color-line)] text-xs text-[var(--color-muted)] flex items-center justify-between bg-[var(--color-bg-elev)]">
            <span>
              {previewPages} page{previewPages === 1 ? "" : "s"} · {state.pageSize}
              <span className="ml-2 text-[10px] opacity-50 hidden sm:inline">Click text to edit · ⌘\ code · ⌘P print</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => iframeRef.current?.contentWindow?.print()}
                className="btn btn-ghost text-xs px-2 py-1"
                style={{ minHeight: 28 }}
                title="Print document"
                aria-label="Print"
              >
                <Printer size={12} />
              </button>
              <button
                onClick={() => gateFeature("create a public share link")}
                className="btn btn-ghost text-xs px-2 py-1"
                style={{ minHeight: 28, minWidth: 28 }}
                aria-label="Share (sign in required)"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden relative" data-print-area>
            <iframe
              ref={iframeRef}
              srcDoc={previewSrc}
              title="PDF preview"
              sandbox="allow-scripts allow-same-origin allow-modals"
              className="w-full h-full bg-[#d4d4d8] block"
              data-testid="guest-preview"
            />
            {showCode && (
              <Suspense fallback={null}>
                <CodePanel
                  html={state.html}
                  css={state.css}
                  onPreviewChange={(html, css) => setLocalCode({ html, css })}
                  onSave={(html, css) => {
                    setLocalCode(null);
                    setState((s) => ({ ...s, html, css, updatedAt: Date.now() }));
                  }}
                  onClose={() => { setShowCode(false); setLocalCode(null); }}
                />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {signInPrompt && (
        <SignInModal
          message={signInPrompt}
          authConfigured={authConfigured}
          onClose={() => setSignInPrompt(null)}
        />
      )}
    </div>
  );
}

function ChatMessage({ turn }: { turn: GuestTurn }) {
  const cleanContent = useMemo(() => {
    if (turn.role !== "assistant") return turn.content;
    return (
      turn.content
        .replace(/```html\s*\n[\s\S]*?\n```/g, "")
        .replace(/```css\s*\n[\s\S]*?\n```/g, "")
        .trim() || "Updated."
    );
  }, [turn.content, turn.role]);

  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 bg-gradient-to-br from-[var(--color-cyan)]/15 to-[var(--color-blue)]/10 border border-[var(--color-cyan)]/20 text-sm whitespace-pre-wrap break-words">
          {turn.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className="size-7 rounded-full bg-[var(--color-cyan)]/15 grid place-items-center text-[var(--color-cyan)] shrink-0 mt-0.5">
        <Sparkles size={14} />
      </div>
      <div className="flex-1 min-w-0 text-sm whitespace-pre-wrap break-words text-[var(--color-fg)]/90">
        {cleanContent}
      </div>
    </div>
  );
}

const SignInModal: FC<{
  message: string;
  authConfigured: boolean;
  onClose: () => void;
}> = ({ message, authConfigured, onClose }) => {
  const trapRef = useFocusTrap<HTMLDivElement>();
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-signin-title"
        className="card max-w-sm w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="size-12 rounded-full bg-[var(--color-cyan)]/15 grid place-items-center text-[var(--color-cyan)] mx-auto mb-3">
          <LogIn size={20} />
        </div>
        <h2 id="guest-signin-title" className="font-semibold text-lg mb-1">
          One step away
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-5 text-pretty">{message}</p>
        {authConfigured ? (
          <div className="flex flex-col gap-2">
            <Link
              to="/sign-in"
              className="btn btn-primary w-full"
              style={{ minHeight: 40 }}
              onClick={() => {
                captureEvent("guest_to_signin");
                try {
                  const raw = localStorage.getItem(STORAGE_KEY);
                  if (raw) sessionStorage.setItem(IMPORT_KEY, raw);
                } catch { /* ignore */ }
              }}
            >
              Continue with Google
            </Link>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-muted)]/80">
            Sign-in is launching soon. Your guest document stays in this browser.
          </p>
        )}
        <button
          autoFocus
          onClick={onClose}
          className="text-xs text-[var(--color-muted)] underline-hover mt-4"
        >
          Keep editing as guest
        </button>
      </div>
    </div>
  );
}
