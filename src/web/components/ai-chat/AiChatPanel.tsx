import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Sparkles,
  X,
  Plus,
  MessageSquarePlus,
  History,
  Download,
  MoreHorizontal,
  Copy,
  RotateCcw,
  Square,
  Trash2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { renderMarkdown } from "./markdown";
import { useChat } from "./useChat";
import { usePageContext } from "./usePageContext";
import { WidgetList } from "./widgets";
import { Composer } from "./Composer";
import { filterCommands, type Command, type UiCommand } from "./commands";
import { chipsForPath } from "./empty-state-chips";
import type { Message, Thread } from "./types";

const SHORTCUT_KEY = "k";
const LAUNCH_DELAY_MS = 1200;

function exportThreadMarkdown(thread: Thread): string {
  const lines = [`# ${thread.title}`, ""];
  for (const m of thread.messages) {
    lines.push(`## ${m.role === "user" ? "You" : "Assistant"}`);
    lines.push("");
    if (m.content) lines.push(m.content);
    if (m.widgets?.length) {
      lines.push(`\n_${m.widgets.length} widget${m.widgets.length === 1 ? "" : "s"} attached._`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function downloadFile(name: string, content: string, type = "text/markdown"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Floating launcher + slide-in side panel. Auto-mounts the side-panel chrome
 * once on first open; persists threads in localStorage; remembers active id.
 */
export function AiChatPanel() {
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const chat = useChat();
  const page = usePageContext();
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const [introVisible, setIntroVisible] = useState(false);

  // Surface a tiny pulse on the launcher after first paint.
  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(true), LAUNCH_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Cmd/Ctrl+K toggles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === SHORTCUT_KEY) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Escape closes; lock body scroll on mobile when open.
  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowHistory(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("aichat-no-scroll");
    // Focus the panel for screen readers.
    setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("aichat-no-scroll");
      // Restore focus to launcher / last element.
      (lastFocusRef.current ?? launcherRef.current)?.focus?.();
    };
  }, [open]);

  // Auto-scroll the message list as content streams.
  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [chat.active?.messages.length, chat.phase]);

  const runUi = useCallback(
    (cmd: UiCommand) => {
      switch (cmd.action) {
        case "new":
          chat.newThread();
          return;
        case "clear":
          chat.clearActive();
          return;
        case "export": {
          if (!chat.active) return;
          downloadFile(`${chat.active.title}.md`, exportThreadMarkdown(chat.active));
          return;
        }
        case "copyLast":
          void chat.copyLast();
          return;
        case "stop":
          chat.stop();
          return;
        case "regenerate":
          void chat.regenerate();
          return;
        case "settings":
        case "feedback":
          chat.pushAssistantWidgets("Email **hey@megabyte.space** with your thoughts — we read every one.", [
            {
              kind: "cta",
              payload: { label: "Open email", href: "mailto:hey@megabyte.space", variant: "primary", external: true },
            },
          ]);
          return;
        case "share": {
          const url = typeof window !== "undefined" ? window.location.href : "/";
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            void navigator.clipboard.writeText(url);
          }
          chat.pushAssistantWidgets(`Copied the current page URL to your clipboard:\n\n\`${url}\``, []);
          return;
        }
      }
    },
    [chat]
  );

  const runCommand = useCallback(
    (cmd: Command, args: string) => {
      if (cmd.kind === "ui") {
        runUi(cmd);
        return;
      }
      if (cmd.kind === "nav") {
        // Push user echo + assistant link card, then navigate.
        void chat.send(cmd.name, {
          widgets: [
            {
              kind: "cta",
              title: `Opening ${cmd.href}`,
              payload: { label: cmd.description, href: cmd.href, variant: "primary" },
            },
          ],
        });
        setOpen(false);
        setTimeout(() => {
          window.location.assign(cmd.href);
        }, 220);
        return;
      }
      if (cmd.kind === "widget") {
        void chat.send(cmd.name, { widgets: cmd.getWidgets() });
        if (cmd.intro) {
          chat.pushAssistantWidgets(cmd.intro, cmd.getWidgets());
        }
        return;
      }
      // prompt
      const enriched = cmd.getPrompt(args);
      void chat.send(enriched, { pageContext: page });
    },
    [chat, page, runUi]
  );

  const onSend = useCallback(
    (text: string) => {
      void chat.send(text, { pageContext: page });
    },
    [chat, page]
  );

  const onPromptChip = useCallback(
    (prompt: string) => {
      if (prompt.startsWith("/")) {
        const v = prompt.trim();
        const space = v.indexOf(" ");
        const head = (space === -1 ? v : v.slice(0, space)).toLowerCase();
        const args = space === -1 ? "" : v.slice(space + 1);
        const hit = filterCommands(head, 1)[0];
        if (hit && hit.name.toLowerCase() === head) runCommand(hit, args);
        else onSend(prompt);
        return;
      }
      onSend(prompt);
    },
    [onSend, runCommand]
  );

  const onRunCommandName = useCallback(
    (name: string) => {
      const v = name.trim();
      const space = v.indexOf(" ");
      const head = (space === -1 ? v : v.slice(0, space)).toLowerCase();
      const args = space === -1 ? "" : v.slice(space + 1);
      const hit = filterCommands(head, 1)[0];
      if (hit && hit.name.toLowerCase() === head) runCommand(hit, args);
    },
    [runCommand]
  );

  const threads = useMemo<Thread[]>(
    () => chat.store.order.map((id) => chat.store.threads[id]).filter((t): t is Thread => !!t),
    [chat.store]
  );

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`aichat-launcher ${introVisible ? "is-visible" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="aichat-panel"
        onClick={() => setOpen((v) => !v)}
        title="AI Chat (⌘K)"
      >
        <Sparkles size={18} aria-hidden="true" />
        <span className="aichat-launcher-label">Ask AI</span>
        <kbd className="aichat-launcher-kbd" aria-hidden="true">⌘K</kbd>
      </button>

      <div className={`aichat-scrim ${open ? "is-open" : ""}`} aria-hidden="true" onClick={() => setOpen(false)} />

      <aside
        ref={panelRef}
        id="aichat-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className={`aichat-panel ${open ? "is-open" : ""}`}
      >
        <header className="aichat-header">
          <div className="aichat-header-left">
            <div className="aichat-brand">
              <Sparkles size={14} aria-hidden="true" />
              <span id={headingId}>Megabyte Assist</span>
            </div>
            <button
              type="button"
              className="aichat-iconbtn"
              onClick={() => setShowHistory((v) => !v)}
              aria-label={showHistory ? "Close thread history" : "Open thread history"}
              aria-pressed={showHistory}
              title="Thread history"
            >
              <History size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="aichat-iconbtn"
              onClick={() => chat.newThread()}
              aria-label="New chat"
              title="New chat"
            >
              <MessageSquarePlus size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="aichat-header-right">
            <button
              type="button"
              className="aichat-iconbtn"
              onClick={() => {
                if (chat.active) downloadFile(`${chat.active.title}.md`, exportThreadMarkdown(chat.active));
              }}
              aria-label="Export thread as markdown"
              title="Export"
              disabled={!chat.active || chat.active.messages.length === 0}
            >
              <Download size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="aichat-iconbtn aichat-close"
              onClick={() => setOpen(false)}
              aria-label="Close AI chat"
              title="Close (Esc)"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </header>

        {showHistory ? (
          <div className="aichat-history" role="region" aria-label="Thread history">
            <button
              type="button"
              className="aichat-history-new"
              onClick={() => {
                chat.newThread();
                setShowHistory(false);
              }}
            >
              <Plus size={12} aria-hidden="true" />
              <span>New chat</span>
            </button>
            {threads.length === 0 ? (
              <p className="aichat-history-empty">No saved chats yet.</p>
            ) : (
              <ul>
                {threads.map((t) => (
                  <li
                    key={t.id}
                    className={`aichat-history-item ${t.id === chat.activeId ? "is-active" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        chat.openThread(t.id);
                        setShowHistory(false);
                      }}
                      className="aichat-history-pick"
                    >
                      <span className="aichat-history-title">{t.title}</span>
                      <span className="aichat-history-meta">
                        {new Date(t.updatedAt).toLocaleDateString()} · {t.messages.length} msg
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => chat.deleteThread(t.id)}
                      aria-label={`Delete chat "${t.title}"`}
                      className="aichat-iconbtn"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {threads.length > 0 ? (
              <button
                type="button"
                className="aichat-history-clearall"
                onClick={() => {
                  if (confirm("Delete all saved chats?")) chat.clearAll();
                }}
              >
                Clear all chats
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="aichat-body" ref={messageListRef}>
          {!chat.active || chat.active.messages.length === 0 ? (
            <EmptyState path={page.path} onRunCommand={onRunCommandName} onPrompt={onPromptChip} />
          ) : (
            <ul className="aichat-messages" aria-label="Chat messages">
              {chat.active.messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  onPrompt={onPromptChip}
                  onRunCommand={onRunCommandName}
                  onCopy={() => navigator.clipboard.writeText(m.content).catch(() => {})}
                  onFeedback={(verdict) => chat.setFeedback(m.id, verdict)}
                />
              ))}
            </ul>
          )}
          {chat.phase === "errored" && chat.error ? (
            <div className="aichat-error" role="alert">{chat.error}</div>
          ) : null}
        </div>

        <footer className="aichat-footer">
          <div className="aichat-toolbar">
            <button
              type="button"
              onClick={() => onRunCommandName("/shortcommands")}
              className="aichat-toolbar-btn"
              title="List slash commands"
            >
              <MoreHorizontal size={12} aria-hidden="true" />
              <span>Commands</span>
            </button>
            <button
              type="button"
              onClick={() => void chat.regenerate()}
              className="aichat-toolbar-btn"
              disabled={!chat.active || chat.active.messages.length === 0 || chat.phase === "streaming"}
              title="Regenerate last reply"
            >
              <RotateCcw size={12} aria-hidden="true" />
              <span>Regenerate</span>
            </button>
            <button
              type="button"
              onClick={() => void chat.copyLast()}
              className="aichat-toolbar-btn"
              disabled={!chat.active}
              title="Copy last reply"
            >
              <Copy size={12} aria-hidden="true" />
              <span>Copy last</span>
            </button>
            {chat.phase === "streaming" || chat.phase === "connecting" ? (
              <button
                type="button"
                onClick={chat.stop}
                className="aichat-toolbar-btn is-stop"
                title="Stop streaming"
              >
                <Square size={12} aria-hidden="true" />
                <span>Stop</span>
              </button>
            ) : null}
          </div>
          <Composer
            phase={chat.phase}
            onSend={onSend}
            onStop={chat.stop}
            onRunCommand={runCommand}
          />
          <div className="aichat-footnote">
            Replies may be inaccurate · <button type="button" onClick={() => onRunCommandName("/feedback")} className="aichat-link">Send feedback</button>
          </div>
        </footer>
      </aside>
    </>
  );
}

function EmptyState({
  path,
  onRunCommand,
  onPrompt,
}: {
  path: string | undefined;
  onRunCommand: (cmd: string) => void;
  onPrompt: (p: string) => void;
}) {
  const chips = chipsForPath(path);
  return (
    <div className="aichat-empty">
      <Sparkles size={22} className="aichat-empty-icon" aria-hidden="true" />
      <h3>How can I help?</h3>
      <p>
        Ask about Megabyte PDF, draft a document, or browse the site by command.
      </p>
      <div className="aichat-empty-chips" role="group" aria-label="Suggested starters">
        {chips.map((c) => (
          <button key={c.cmd} type="button" className="aichat-chip" onClick={() => onRunCommand(c.cmd)}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="aichat-empty-hint">
        Or type a question:&nbsp;
        <button type="button" className="aichat-link" onClick={() => onPrompt("What does Megabyte PDF do?")}>
          What does Megabyte PDF do?
        </button>
      </p>
    </div>
  );
}

function MessageRow({
  message,
  onPrompt,
  onRunCommand,
  onCopy,
  onFeedback,
}: {
  message: Message;
  onPrompt: (prompt: string) => void;
  onRunCommand: (cmd: string) => void;
  onCopy: () => void;
  onFeedback: (verdict: "up" | "down") => void;
}) {
  const isUser = message.role === "user";
  const verdict = message.feedback;
  const hasReply = Boolean(message.content) || Boolean(message.widgets?.length);
  return (
    <li className={`aichat-msg ${isUser ? "is-user" : "is-bot"}`}>
      {isUser ? (
        <div className="aichat-bubble">{message.content}</div>
      ) : (
        <div className="aichat-bubble">
          {message.content ? (
            <div className="assist-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
          ) : null}
          {message.widgets?.length ? (
            <WidgetList widgets={message.widgets} onPrompt={onPrompt} onRunCommand={onRunCommand} />
          ) : null}
          {message.errored ? <div className="aichat-msg-err">⚠ {message.content || "Stream error."}</div> : null}
          {message.stopped ? <div className="aichat-msg-stopped">Stopped.</div> : null}
          <div className="aichat-msg-actions">
            {message.content ? (
              <button type="button" className="aichat-msg-action" onClick={onCopy} aria-label="Copy reply">
                <Copy size={11} aria-hidden="true" />
                <span>Copy</span>
              </button>
            ) : null}
            {hasReply ? (
              <>
                <button
                  type="button"
                  className={`aichat-msg-action${verdict === "up" ? " is-on" : ""}`}
                  onClick={() => onFeedback("up")}
                  aria-pressed={verdict === "up"}
                  aria-label="Good reply"
                  title="Helpful"
                >
                  <ThumbsUp size={11} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`aichat-msg-action${verdict === "down" ? " is-on" : ""}`}
                  onClick={() => onFeedback("down")}
                  aria-pressed={verdict === "down"}
                  aria-label="Bad reply"
                  title="Not helpful"
                >
                  <ThumbsDown size={11} aria-hidden="true" />
                </button>
              </>
            ) : null}
            {message.durationMs ? (
              <span className="aichat-msg-meta">{(message.durationMs / 1000).toFixed(1)}s</span>
            ) : null}
          </div>
        </div>
      )}
    </li>
  );
}
