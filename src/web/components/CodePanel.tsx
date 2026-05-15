import { useEffect, useRef, useState } from "react";
import { X, Copy, Check, Download } from "lucide-react";
import { EditorView, basicSetup } from "codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorState } from "@codemirror/state";

type Tab = "html" | "css";

function CmEditor({
  value,
  language,
  onChange,
}: {
  value: string;
  language: "html" | "css";
  onChange: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    if (!containerRef.current) return;
    const lang = language === "html" ? htmlLang() : cssLang();
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          lang,
          oneDark,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "13px" },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            },
            ".cm-editor": { height: "100%" },
          }),
        ],
      }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  // Intentionally only re-runs on language change; the editor binds to
  // its own state and does not need React-driven dependency tracking.
  }, [language]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  return <div ref={containerRef} className="h-full min-h-0 overflow-auto" />;
}

export function CodePanel({
  html,
  css,
  onPreviewChange,
  onSave,
  onClose,
}: {
  html: string;
  css: string;
  onPreviewChange: (html: string, css: string) => void;
  onSave: (html: string, css: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("html");
  const [draftHtml, setDraftHtml] = useState(html);
  const [draftCss, setDraftCss] = useState(css);
  const [copied, setCopied] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPreviewRef = useRef(onPreviewChange);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onPreviewRef.current = onPreviewChange; });
  useEffect(() => { onSaveRef.current = onSave; });

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  // Sync external prop updates (e.g. after AI response) into drafts
  useEffect(() => { setDraftHtml(html); }, [html]);
  useEffect(() => { setDraftCss(css); }, [css]);

  function handleChange(nextHtml: string, nextCss: string) {
    // Immediate live preview — no debounce
    onPreviewRef.current(nextHtml, nextCss);
    // Debounced server persist
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSaveRef.current(nextHtml, nextCss);
    }, 1200);
  }

  return (
    <aside
      aria-label="Code editor"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        maxWidth: "50%",
        background: "color-mix(in srgb, var(--color-bg-elev) 88%, transparent)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.5)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--color-line)",
        animation: "codepanel-in 0.2s ease-out",
      }}
    >
      <div
        role="tablist"
        aria-label="Code tabs"
        aria-orientation="horizontal"
        className="border-b border-[var(--color-line)] px-3 py-2 flex items-center gap-1 shrink-0"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setTab("css");
          else if (e.key === "ArrowLeft") setTab("html");
        }}
      >
        <button
          role="tab"
          aria-selected={tab === "html"}
          aria-controls="codepanel-tab-html"
          tabIndex={tab === "html" ? 0 : -1}
          onClick={() => setTab("html")}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            tab === "html"
              ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]"
              : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
          }`}
        >
          HTML
        </button>
        <button
          role="tab"
          aria-selected={tab === "css"}
          aria-controls="codepanel-tab-css"
          tabIndex={tab === "css" ? 0 : -1}
          onClick={() => setTab("css")}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            tab === "css"
              ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]"
              : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
          }`}
        >
          CSS
        </button>
        <div className="flex-1" />
        <button
          onClick={async () => {
            const content = tab === "html" ? draftHtml : draftCss;
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="size-7 rounded-md hover:bg-white/5 grid place-items-center transition-colors"
          title="Copy to clipboard"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
        </button>
        <button
          onClick={() => {
            const content = tab === "html" ? draftHtml : draftCss;
            const ext = tab === "html" ? "html" : "css";
            const blob = new Blob([content], { type: `text/${ext}` });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `document.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="size-7 rounded-md hover:bg-white/5 grid place-items-center transition-colors"
          title={`Download ${tab.toUpperCase()}`}
          aria-label={`Download ${tab.toUpperCase()}`}
        >
          <Download size={13} />
        </button>
        <button
          onClick={onClose}
          className="size-7 rounded-md hover:bg-white/5 grid place-items-center transition-colors"
          aria-label="Close code panel"
        >
          <X size={14} />
        </button>
      </div>
      <div role="tabpanel" id={`codepanel-tab-${tab}`} className="flex-1 min-h-0 overflow-hidden">
        {tab === "html" ? (
          <CmEditor
            key="html"
            value={draftHtml}
            language="html"
            onChange={(v) => {
              setDraftHtml(v);
              handleChange(v, draftCss);
            }}
          />
        ) : (
          <CmEditor
            key="css"
            value={draftCss}
            language="css"
            onChange={(v) => {
              setDraftCss(v);
              handleChange(draftHtml, v);
            }}
          />
        )}
      </div>
    </aside>
  );
}
