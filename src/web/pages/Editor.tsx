import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Send,
  Code2,
  Download,
  Share2,
  History,
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowLeft,
  Crown,
  Zap,
  Printer,
  Maximize2,
  Minimize2,
  Cloud,
  ExternalLink,
  Play,
  Globe,
  Command,
  FileCode2,
  Search,
  Wand2,
  LayoutTemplate,
  ImageDown,
  PanelLeft,
} from "lucide-react";
import { useApi, useAuthFetch, ApiError } from "../lib/api";
import { captureEvent } from "../lib/analytics";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type {
  ChatResponse,
  Project,
  ShareLink,
  Snapshot,
  Turn,
} from "../lib/types";
import { buildPreviewDoc } from "../lib/preview";
import { play as playSound } from "../lib/sound";
import { suggestNext } from "../lib/suggestions";
import { TopBar } from "../components/TopBar";
import { PDFPicker } from "../components/PDFPicker";
import { PublishModal } from "../components/PublishModal";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
const CodePanel = lazy(() => import("../components/CodePanel").then((m) => ({ default: m.CodePanel })));
const PresentMode = lazy(() => import("../components/PresentMode").then((m) => ({ default: m.PresentMode })));

interface EditorData {
  project: Project;
  turns: Turn[];
  snapshots: Snapshot[];
  shares: ShareLink[];
}

type BlockKind =
  | "cover"
  | "toc"
  | "signature"
  | "references"
  | "cta"
  | "executive-summary"
  | "thank-you"
  | "divider";

const BLOCK_LABELS: Record<BlockKind, string> = {
  cover: "Insert cover page",
  toc: "Insert table of contents",
  "executive-summary": "Insert executive summary",
  signature: "Insert signature block",
  references: "Insert references",
  cta: "Insert call-to-action",
  "thank-you": "Insert thank-you page",
  divider: "Insert divider",
};

const BLOCK_MODE: Record<BlockKind, "prepend" | "append"> = {
  cover: "prepend",
  toc: "prepend",
  "executive-summary": "prepend",
  signature: "append",
  references: "append",
  cta: "append",
  "thank-you": "append",
  divider: "append",
};

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const authFetch = useAuthFetch();
  const navigate = useNavigate();
  const [data, setData] = useState<EditorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [savingToDrive, setSavingToDrive] = useState(false);
  const [driveToast, setDriveToast] = useState<{ link: string | null; name: string } | null>(null);
  const [message, setMessage] = useState("");
  const [model, setModel] = useState<"sonnet" | "opus">("sonnet");
  const [showCode, setShowCode] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [previewPages, setPreviewPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [pageOutline, setPageOutline] = useState<Array<{ num: number; title: string }>>([]);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("megabyte-pdf:thumbs") === "on";
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [cinema, setCinema] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [localCode, setLocalCode] = useState<{ html: string; css: string } | null>(null);
  const [inlineSaved, setInlineSaved] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [prettifying, setPrettifying] = useState(false);
  const [insertingBlock, setInsertingBlock] = useState<BlockKind | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const liveHtmlRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiRef = useRef(api);
  const idRef = useRef(id);
  useEffect(() => { apiRef.current = api; }, [api]);
  useEffect(() => { idRef.current = id; }, [id]);
  useDocumentTitle(data?.project.title ? `${data.project.title} — Editor` : "Editor");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<EditorData>(`/api/projects/${id}`);
      setData(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        navigate("/dashboard");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [api, id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const key = `megabyte-pdf:prefill:${id}`;
    const prefill = sessionStorage.getItem(key);
    if (!prefill) return;
    sessionStorage.removeItem(key);
    setMessage(prefill);
    captureEvent("editor_prefill_loaded", { length: prefill.length });
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [id]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "preview:rendered" && typeof e.data.pages === "number") {
        setPreviewPages(e.data.pages);
        // Re-enable contenteditable on every page (pagination may create new pages
        // after the initial iframe load fired, so we need a second pass).
        const doc = iframeRef.current?.contentDocument;
        doc?.querySelectorAll<HTMLElement>(".page").forEach((page) => {
          page.contentEditable = "true";
          page.spellcheck = true;
        });
        const outline: Array<{ num: number; title: string }> = [];
        doc?.querySelectorAll<HTMLElement>(".page").forEach((page, i) => {
          const heading = page.querySelector<HTMLElement>("h1, h2, h3, header, .title");
          const title = (heading?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
          outline.push({ num: i + 1, title });
        });
        setPageOutline(outline);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Always-on inline editing — re-enabled automatically on each iframe load
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function onLoad() {
      liveHtmlRef.current = null;
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      // Enable contenteditable on all page divs (cursor:text already set in shared CSS)
      doc.querySelectorAll<HTMLElement>(".page").forEach((page) => {
        page.contentEditable = "true";
        page.spellcheck = true;
      });

      // Track all changes and debounce auto-save to server (no re-render)
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
          const currentId = idRef.current;
          const currentApi = apiRef.current;
          if (!html || !currentId) return;
          liveHtmlRef.current = null;
          void currentApi<{ project: Project }>(`/api/projects/${currentId}`, {
            method: "PATCH",
            body: JSON.stringify({ html }),
          }).then((res) => {
            setData((d) => d ? { ...d, project: res.project } : d);
            setInlineSaved(true);
            setTimeout(() => setInlineSaved(false), 2000);
          }).catch(() => {});
        }, 800);
      });
    }

    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => iframe.removeEventListener("load", onLoad);
  }, []); // attach once — fires naturally on each srcDoc reload

  // Cleanup debounce timer on unmount
  useEffect(() => () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); }, []);

  // Auto-resize textarea as user types
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
      if (meta && e.key === "k") {
        e.preventDefault();
        setShowPalette((s) => !s);
      }
      if (meta && e.key === "\\") {
        e.preventDefault();
        setShowCode((s) => !s);
      }
      if (meta && e.key === "p") {
        e.preventDefault();
        iframeRef.current?.contentWindow?.print();
      }
      if (meta && e.key === ".") {
        e.preventDefault();
        setShowThumbnails((s) => {
          const next = !s;
          try {
            window.localStorage.setItem("megabyte-pdf:thumbs", next ? "1" : "0");
          } catch {
            /* localStorage unavailable */
          }
          return next;
        });
      }
      // Cinema mode — F when not focused in input/textarea
      if (
        e.key === "f" &&
        !meta && !e.shiftKey && !e.altKey &&
        !(e.target as HTMLElement)?.closest("input,textarea,[contenteditable=true]")
      ) {
        e.preventDefault();
        setCinema((c) => !c);
      }
      if (e.key === "Escape") {
        if (cinema) { setCinema(false); return; }
        if (showCode) { setShowCode(false); setLocalCode(null); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showCode, cinema]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (cinema) document.body.setAttribute("data-cinema", "on");
    else document.body.removeAttribute("data-cinema");
    return () => {
      document.body.removeAttribute("data-cinema");
    };
  }, [cinema]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (sending) document.body.setAttribute("data-ai-busy", "on");
    else document.body.removeAttribute("data-ai-busy");
    return () => {
      document.body.removeAttribute("data-ai-busy");
    };
  }, [sending]);

  const scrollToPage = useCallback((idx: number) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const pages = doc.querySelectorAll<HTMLElement>(".page");
    const target = pages[idx - 1];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActivePage(idx);
    captureEvent("editor_page_nav", { page: idx, total: pages.length });
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [data?.turns.length, sending]);

  const previewSrc = useMemo(() => {
    if (!data) return "";
    const h = localCode?.html ?? data.project.html;
    const c = localCode?.css ?? data.project.css;
    return buildPreviewDoc(h, c, data.project.pageSize, data.project.margin);
  }, [data, localCode]);

  const suggestions = useMemo(
    () => (data ? suggestNext(data.project.html, Boolean(data.project.isPublic), data.turns.length) : []),
    [data?.project.html, data?.project.isPublic, data?.turns.length],
  );

  async function syncInlineEdits() {
    const html = liveHtmlRef.current;
    if (!html || !id) return;
    liveHtmlRef.current = null;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    // Persist to server without updating local state (avoids iframe reload)
    await api(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ html }),
    }).catch(() => {});
  }

  function printDocument() {
    iframeRef.current?.contentWindow?.print();
  }

  async function send() {
    const text = message.trim();
    if (!text || !id || sending) return;
    // Flush any pending inline edits to server so AI sees latest content
    await syncInlineEdits();
    setSending(true);
    setError(null);
    setMessage("");
    const optimisticTurn: Turn = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setData((d) => (d ? { ...d, turns: [...d.turns, optimisticTurn] } : d));
    playSound("send");
    captureEvent("editor_chat_send", { model, messageLength: text.length });
    const startedAt = performance.now();
    try {
      const res = await api<ChatResponse>(`/api/projects/${id}/chat`, {
        method: "POST",
        body: JSON.stringify({ message: text, model }),
      });
      const durationMs = Math.round(performance.now() - startedAt);
      const u = res.usage ?? { input_tokens: 0, output_tokens: 0 };
      const inputTokens = u.input_tokens ?? 0;
      const outputTokens = u.output_tokens ?? 0;
      const cacheReadTokens = u.cache_read_input_tokens ?? 0;
      const cacheWriteTokens = u.cache_creation_input_tokens ?? 0;
      const cacheHitRate = inputTokens > 0 ? cacheReadTokens / (inputTokens + cacheReadTokens) : 0;
      captureEvent("ai_generation_completed", {
        model: res.model || model,
        model_alias: model,
        duration_ms: durationMs,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_read_tokens: cacheReadTokens,
        cache_write_tokens: cacheWriteTokens,
        cache_hit_rate: Number(cacheHitRate.toFixed(3)),
        produced_html: Boolean(res.project?.html),
        produced_snapshot: Boolean(res.snapshotId),
      });
      playSound("receive");
      setLocalCode(null); // AI response supersedes any local code edits
      // Trigger AI auto-title on first successful AI response if title is still default
      // and AI hasn't named it yet. Fire-and-forget; we reload below either way.
      if (
        res.project?.title === "Untitled PDF" &&
        !res.project.aiTitleGenerated
      ) {
        api(`/api/projects/${id}/ai-title`, { method: "POST" }).catch(() => {});
      }
      await load();
    } catch (e) {
      const durationMs = Math.round(performance.now() - startedAt);
      const status = e instanceof ApiError ? e.status : 0;
      captureEvent("ai_generation_failed", {
        model,
        duration_ms: durationMs,
        status,
        error: e instanceof Error ? e.message.slice(0, 200) : "unknown",
      });
      if (e instanceof ApiError && e.status === 402) {
        setShowUpgrade(true);
        setData((d) =>
          d ? { ...d, turns: d.turns.filter((t) => t.id !== optimisticTurn.id) } : d
        );
      } else {
        playSound("error");
        setError(e instanceof Error ? e.message : "Send failed");
        setData((d) =>
          d ? { ...d, turns: d.turns.filter((t) => t.id !== optimisticTurn.id) } : d
        );
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function makePrettier() {
    if (!id || prettifying) return;
    await syncInlineEdits();
    setPrettifying(true);
    setError(null);
    captureEvent("editor_prettier_start");
    const startedAt = performance.now();
    try {
      await api<{ project: Project; snapshotId: string | null }>(
        `/api/projects/${id}/prettier`,
        { method: "POST" }
      );
      captureEvent("editor_prettier_success", {
        duration_ms: Math.round(performance.now() - startedAt),
      });
      setLocalCode(null);
      await load();
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      captureEvent("editor_prettier_error", { status });
      if (e instanceof ApiError && e.status === 402) {
        setShowUpgrade(true);
      } else if (e instanceof ApiError && e.status === 429) {
        setError("Slow down — try again in a moment.");
      } else {
        setError(e instanceof Error ? e.message : "Prettier failed");
      }
    } finally {
      setPrettifying(false);
    }
  }

  async function insertBlock(kind: BlockKind) {
    if (!id || insertingBlock) return;
    await syncInlineEdits();
    setInsertingBlock(kind);
    setError(null);
    captureEvent("editor_insert_block_start", { kind });
    try {
      await api<{ project: Project; snapshotId: string | null }>(
        `/api/projects/${id}/insert`,
        {
          method: "POST",
          body: JSON.stringify({ kind, mode: BLOCK_MODE[kind] }),
        }
      );
      captureEvent("editor_insert_block_success", { kind });
      setLocalCode(null);
      await load();
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      captureEvent("editor_insert_block_error", { kind, status });
      if (e instanceof ApiError && e.status === 402) {
        setShowUpgrade(true);
      } else if (e instanceof ApiError && e.status === 429) {
        setError("Slow down — try again in a moment.");
      } else {
        setError(e instanceof Error ? e.message : "Insert failed");
      }
    } finally {
      setInsertingBlock(null);
    }
  }

  async function upgrade() {
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", { method: "POST" });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Billing unavailable");
    }
  }

  async function exportPdf() {
    if (!id || exporting) return;
    setExporting(true);
    captureEvent("editor_export_start");
    try {
      const res = await api<{ downloadUrl: string; filename: string }>(
        `/api/projects/${id}/export`,
        { method: "POST" }
      );
      const dl = await authFetch(res.downloadUrl);
      if (!dl.ok) throw new Error("Download failed");
      const blob = await dl.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      playSound("success");
      captureEvent("editor_export_success", { filename: res.filename });
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        captureEvent("editor_export_upgrade_prompt");
        setShowUpgrade(true);
      } else {
        captureEvent("editor_export_error", { error: e instanceof Error ? e.message : "unknown" });
        setError(e instanceof Error ? e.message : "Export failed");
      }
    } finally {
      setExporting(false);
    }
  }

  async function exportPng() {
    if (!id || exportingPng) return;
    setExportingPng(true);
    captureEvent("editor_export_png_start");
    try {
      const res = await api<{ downloadUrl: string; filename: string }>(
        `/api/projects/${id}/export-png?page=0`,
        { method: "POST" }
      );
      const dl = await authFetch(res.downloadUrl);
      if (!dl.ok) throw new Error("Download failed");
      const blob = await dl.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      playSound("success");
      captureEvent("editor_export_png_success", { filename: res.filename });
    } catch (e) {
      captureEvent("editor_export_png_error", { error: e instanceof Error ? e.message : "unknown" });
      setError(e instanceof Error ? e.message : "PNG export failed");
    } finally {
      setExportingPng(false);
    }
  }

  async function saveToDrive() {
    if (!id || savingToDrive) return;
    setSavingToDrive(true);
    captureEvent("editor_drive_save_start");
    try {
      const res = await api<{
        ok: boolean;
        file: { id: string; name: string; webViewLink: string | null };
      }>(`/api/projects/${id}/drive`, { method: "POST" });
      setDriveToast({ link: res.file.webViewLink, name: res.file.name });
      captureEvent("editor_drive_save_success", { name: res.file.name });
    } catch (e) {
      if (e instanceof ApiError && e.body && typeof e.body === "object" && "code" in e.body && e.body.code === "GOOGLE_REAUTH") {
        captureEvent("editor_drive_reauth");
        window.location.href = `/api/auth/google?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      captureEvent("editor_drive_save_error", { error: e instanceof Error ? e.message : "unknown" });
      setError(e instanceof Error ? e.message : "Save to Drive failed");
    } finally {
      setSavingToDrive(false);
    }
  }

  async function createShare() {
    if (!id) return;
    try {
      await api<{ slug: string; url: string }>(`/api/projects/${id}/share`, {
        method: "POST",
      });
      playSound("success");
      captureEvent("editor_share_create");
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setShowUpgrade(true);
      } else {
        setError(e instanceof Error ? e.message : "Share failed");
      }
    }
  }

  async function revokeShare(slug: string) {
    if (!id) return;
    try {
      await api(`/api/projects/${id}/share/${slug}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    }
  }

  async function restoreSnapshot(snapId: string) {
    if (!id) return;
    if (!confirm("Restore this version? Current state will become a new snapshot.")) return;
    captureEvent("editor_snapshot_restore");
    try {
      await api(`/api/projects/${id}/snapshots/${snapId}/restore`, { method: "POST" });
      playSound("snapshot");
      await load();
      setShowSnapshots(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
    }
  }

  function downloadSource() {
    if (!data) return;
    const p = data.project;
    const filename = `${(p.title || "untitled").replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.html`;
    const doc = buildPreviewDoc(p.html, p.css, p.pageSize, p.margin);
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    captureEvent("editor_source_download", { filename });
  }

  async function patchProject(patch: Partial<Project>) {
    if (!id) return;
    try {
      const res = await api<{ project: Project }>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setData((d) => (d ? { ...d, project: res.project } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 grid place-items-center">
          <Loader2 size={28} className="animate-spin text-[var(--color-cyan)]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 grid place-items-center text-center px-6">
          <div>
            <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
            <p className="mb-4">{error || "Project not found"}</p>
            <button onClick={() => navigate("/dashboard")} className="btn btn-ghost">
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const project = data.project;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div data-cinema-hide>
      <TopBar>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn btn-ghost text-xs px-2 py-1.5 shrink-0"
          aria-label="Back to dashboard"
          style={{ minHeight: 36, minWidth: 36 }}
        >
          <ArrowLeft size={14} />
        </button>
        <PDFPicker
          currentId={project.id}
          currentTitle={project.title}
          isPublic={project.isPublic}
          onRename={async (next) => {
            await patchProject({ title: next });
          }}
          onAiRename={async () => {
            try {
              const res = await api<{ title: string }>(`/api/projects/${project.id}/ai-title`, {
                method: "POST",
              });
              setData((d) =>
                d ? { ...d, project: { ...d.project, title: res.title } } : d
              );
            } catch {
              // silent
            }
          }}
        />
        <select
          value={project.pageSize}
          onChange={(e) => patchProject({ pageSize: e.target.value as Project["pageSize"] })}
          className="input text-xs py-1.5 w-auto"
          aria-label="Page size"
        >
          <option value="Letter">Letter</option>
          <option value="A4">A4</option>
          <option value="Legal">Legal</option>
        </select>
        <select
          value={project.margin}
          onChange={(e) => patchProject({ margin: e.target.value })}
          className="input text-xs py-1.5 w-auto hidden sm:block"
          aria-label="Page margin"
        >
          <option value="0.5in">Narrow</option>
          <option value="0.75in">Normal</option>
          <option value="1in">Wide</option>
          <option value="1.25in">Extra wide</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowSnapshots((s) => !s)}
          className="btn btn-ghost text-xs px-3 py-1.5"
          style={{ minHeight: 36 }}
          aria-label="Version history"
          aria-haspopup="dialog"
          aria-expanded={showSnapshots}
        >
          <History size={14} />
          <span className="hidden sm:inline">{data.snapshots.length}</span>
        </button>
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
          aria-label="Toggle code"
          aria-pressed={showCode}
        >
          <Code2 size={14} />
          <span className="hidden sm:inline">Code</span>
        </button>
        <button
          onClick={() => {
            setShowPublish(true);
            captureEvent("editor_publish_click", { isPublic: Boolean(project.isPublic) });
          }}
          className="btn btn-ghost text-xs px-3 py-1.5"
          style={{
            minHeight: 36,
            ...(project.isPublic && {
              backgroundColor: "rgba(0, 229, 255, 0.1)",
              borderColor: "rgba(0, 229, 255, 0.6)",
              color: "var(--color-cyan)",
            }),
          }}
          aria-label={project.isPublic ? "Manage public listing" : "Publish to community"}
        >
          <Globe size={14} />
          <span className="hidden sm:inline">{project.isPublic ? "Public" : "Publish"}</span>
        </button>
        <button
          onClick={saveToDrive}
          disabled={savingToDrive}
          aria-label={savingToDrive ? "Saving to Drive…" : "Save to Google Drive"}
          className="btn btn-ghost text-xs px-3 py-1.5"
          style={{ minHeight: 36 }}
        >
          {savingToDrive ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
          <span className="hidden sm:inline">Drive</span>
        </button>
        <button
          onClick={exportPdf}
          disabled={exporting}
          aria-label={exporting ? "Downloading PDF…" : "Download PDF"}
          className="btn btn-primary text-xs px-3 py-1.5"
          style={{ minHeight: 36 }}
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span className="hidden sm:inline">PDF</span>
        </button>
      </TopBar>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}

      <div className={`flex-1 grid grid-cols-1 overflow-hidden ${fullscreen || cinema ? "" : "lg:grid-cols-[380px_1fr]"}`}>
        {!fullscreen && !cinema && <aside data-cinema-hide className="border-r border-[var(--color-line)] flex flex-col bg-[var(--color-bg-elev)] min-h-0">
          <div ref={chatScrollRef} role="log" aria-live="polite" aria-label="Chat messages" className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
            {data.turns.length === 0 && !sending && (
              <div className="text-center py-8 px-2">
                <Sparkles size={24} className="mx-auto mb-3 text-[var(--color-cyan)]" />
                <p className="text-sm text-[var(--color-muted)] mb-3">
                  Tell the AI what to make. Try:
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
                      onClick={() => {
                        setMessage(s);
                        captureEvent("editor_starter_prompt", { prompt: s });
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }}
                      className="text-xs text-left p-2 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-cyan)]/40 hover:bg-white/[0.02] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {data.turns.map((turn) => (
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
                aria-checked={model === "sonnet"}
                onClick={() => setModel("sonnet")}
                className={`text-xs px-2.5 py-1 rounded-md ${
                  model === "sonnet"
                    ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] border border-[var(--color-cyan)]/40"
                    : "border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                }`}
              >
                Sonnet
              </button>
              <button
                role="radio"
                aria-checked={model === "opus"}
                onClick={() => setModel("opus")}
                className={`text-xs px-2.5 py-1 rounded-md ${
                  model === "opus"
                    ? "bg-[var(--color-violet)]/20 text-[var(--color-violet)] border border-[var(--color-violet)]/40"
                    : "border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                }`}
              >
                Opus
              </button>
            </div>
            {suggestions.length > 0 && message.length === 0 && !sending && data.turns.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2" aria-label="Suggested next prompts">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setMessage(s.prompt);
                      captureEvent("editor_suggestion_click", { id: s.id });
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                    className="text-[11px] px-2 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/40 hover:text-[var(--color-fg)] transition-colors inline-flex items-center gap-1"
                  >
                    <Sparkles size={9} className="text-[var(--color-cyan)]" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <SlashMenu
                message={message}
                onSelect={(text) => {
                  setMessage(text);
                  setTimeout(() => textareaRef.current?.focus(), 0);
                }}
              />
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
                placeholder="Describe a change… (try / for commands, ⌘+Enter to send)"
                aria-label="Chat message"
                className="input resize-none pr-12 pb-6 text-sm"
                style={{ minHeight: 56, maxHeight: 180, overflowY: "auto" }}
                disabled={sending}
              />
              <span className="absolute bottom-2 left-3 text-[10px] text-[var(--color-muted)] pointer-events-none select-none">
                {message.length > 0 && `${message.length}/8000`}
              </span>
              <button
                onClick={send}
                disabled={!message.trim() || sending}
                className="absolute bottom-2 right-2 size-9 rounded-lg bg-[var(--color-cyan)] text-[#060610] grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                aria-label="Send"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </aside>}

        <main id="main-content" data-cinema-stage className="flex flex-col min-h-0 overflow-hidden bg-[#1a1a24] relative">
          {cinema && (
            <button
              onClick={() => setCinema(false)}
              className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-full text-xs bg-black/70 backdrop-blur border border-white/15 text-white/90 hover:bg-black/85"
              aria-label="Exit cinema mode (Esc)"
            >
              <span className="inline-flex items-center gap-1.5">
                <Minimize2 size={12} /> Cinema mode · Esc
              </span>
            </button>
          )}
          <div data-cinema-hide className="px-4 py-2 border-b border-[var(--color-line)] text-xs text-[var(--color-muted)] flex items-center justify-between bg-[var(--color-bg-elev)]">
            <span className="flex items-center gap-2">
              {previewPages > 1 ? (
                <span className="inline-flex items-center gap-0.5" aria-label={`Page ${activePage} of ${previewPages}`}>
                  <button
                    onClick={() => scrollToPage(Math.max(1, activePage - 1))}
                    disabled={activePage <= 1}
                    className="size-5 rounded hover:bg-white/[0.06] disabled:opacity-30 grid place-items-center"
                    aria-label="Previous page"
                  >
                    <ChevronUp size={11} />
                  </button>
                  <span className="tabular-nums px-1">{activePage}/{previewPages}</span>
                  <button
                    onClick={() => scrollToPage(Math.min(previewPages, activePage + 1))}
                    disabled={activePage >= previewPages}
                    className="size-5 rounded hover:bg-white/[0.06] disabled:opacity-30 grid place-items-center"
                    aria-label="Next page"
                  >
                    <ChevronDown size={11} />
                  </button>
                </span>
              ) : (
                <span>1 page</span>
              )}
              · {project.pageSize}
              <span role="status" aria-live="polite" className="text-[10px] flex items-center gap-1">
                {inlineSaved ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <Check size={10} /> Saved
                  </span>
                ) : (
                  <span className="opacity-40 hidden sm:inline">⌘K commands · ⌘\ code · ⌘P print</span>
                )}
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPresenting(true)}
                className="btn btn-ghost text-xs px-2 py-1 text-[var(--color-cyan)]"
                style={{ minHeight: 28 }}
                title="Present (Prezi-style fullscreen)"
                aria-label="Enter present mode"
              >
                <Play size={12} />
                <span className="hidden sm:inline ml-1">Present</span>
              </button>
              <button
                onClick={printDocument}
                className="btn btn-ghost text-xs px-2 py-1"
                style={{ minHeight: 28 }}
                title="Print document"
                aria-label="Print"
              >
                <Printer size={12} />
              </button>
              <button
                onClick={() => setFullscreen((f) => !f)}
                className="btn btn-ghost text-xs px-2 py-1"
                style={{ minHeight: 28 }}
                title={fullscreen ? "Show chat" : "Focus on document"}
                aria-label={fullscreen ? "Show chat panel" : "Hide chat panel"}
                aria-pressed={fullscreen}
              >
                {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <ShareControls
                shares={data.shares}
                onCreate={createShare}
                onRevoke={revokeShare}
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden relative flex" data-print-area>
            {showThumbnails && pageOutline.length > 1 && (
              <nav
                aria-label="Page thumbnails"
                className="w-32 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-bg-elev)] overflow-y-auto scrollbar-thin py-2 px-2 space-y-1.5"
              >
                {pageOutline.map((p) => (
                  <button
                    key={p.num}
                    type="button"
                    onClick={() => scrollToPage(p.num)}
                    aria-label={`Jump to page ${p.num}${p.title ? `: ${p.title}` : ""}`}
                    aria-current={p.num === activePage ? "page" : undefined}
                    className={`w-full aspect-[8.5/11] rounded border text-left p-2 flex flex-col gap-1 transition-colors ${
                      p.num === activePage
                        ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                        : "border-[var(--color-line)] hover:border-[var(--color-cyan)]/40 bg-white/[0.02]"
                    }`}
                  >
                    <span className="text-[10px] tabular-nums text-[var(--color-muted)]">{p.num}</span>
                    <span className="text-[10px] leading-snug line-clamp-3 text-[var(--color-fg)]/80">
                      {p.title || `Page ${p.num}`}
                    </span>
                  </button>
                ))}
              </nav>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={previewSrc}
              title="PDF preview"
              sandbox="allow-scripts allow-same-origin allow-modals"
              className="flex-1 h-full bg-[#d4d4d8] block min-w-0"
            />
            {showCode && (
              <Suspense fallback={null}>
                <CodePanel
                  html={project.html}
                  css={project.css}
                  onPreviewChange={(html, css) => setLocalCode({ html, css })}
                  onSave={(html, css) => patchProject({ html, css })}
                  onClose={() => { setShowCode(false); setLocalCode(null); }}
                />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {showSnapshots && (
        <SnapshotDrawer
          snapshots={data.snapshots}
          onRestore={restoreSnapshot}
          onClose={() => setShowSnapshots(false)}
        />
      )}
      {showUpgrade && (
        <UpgradeModal onUpgrade={upgrade} onClose={() => setShowUpgrade(false)} />
      )}
      {showPublish && (
        <PublishModal
          project={project}
          onClose={() => setShowPublish(false)}
          onPublished={(p) => setData((d) => (d ? { ...d, project: p } : d))}
        />
      )}
      {presenting && (
        <Suspense fallback={null}>
          <PresentMode project={project} onClose={() => setPresenting(false)} />
        </Suspense>
      )}
      {showPalette && (
        <CommandPalette
          onClose={() => setShowPalette(false)}
          actions={[
            { id: "prettier", label: prettifying ? "Making it prettier…" : "Make this prettier (AI)", icon: Wand2, run: makePrettier, disabled: prettifying },
            ...(Object.keys(BLOCK_LABELS) as BlockKind[]).map((kind) => ({
              id: `insert-${kind}`,
              label: insertingBlock === kind ? `Inserting ${kind}…` : BLOCK_LABELS[kind],
              icon: LayoutTemplate,
              run: () => insertBlock(kind),
              disabled: insertingBlock !== null,
            })),
            { id: "publish", label: project.isPublic ? "Manage public listing" : "Publish to community", icon: Globe, run: () => setShowPublish(true), hint: "⌘⇧P" },
            { id: "export", label: "Download PDF", icon: Download, run: exportPdf, disabled: exporting, hint: "⌘P" },
            { id: "export-png", label: exportingPng ? "Exporting PNG…" : "Download cover as PNG", icon: ImageDown, run: exportPng, disabled: exportingPng },
            { id: "drive", label: "Save to Google Drive", icon: Cloud, run: saveToDrive, disabled: savingToDrive },
            { id: "source", label: "Download HTML source", icon: FileCode2, run: downloadSource },
            { id: "code", label: showCode ? "Hide code panel" : "Show code panel", icon: Code2, run: () => setShowCode((s) => !s), hint: "⌘\\" },
            {
              id: "thumbnails",
              label: showThumbnails ? "Hide page thumbnails" : "Show page thumbnails",
              icon: PanelLeft,
              hint: "⌘.",
              run: () => {
                setShowThumbnails((v) => {
                  const next = !v;
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("megabyte-pdf:thumbs", next ? "on" : "off");
                  }
                  captureEvent("editor_thumbnails_toggled", { on: next });
                  return next;
                });
              },
            },
            { id: "share", label: "Create share link", icon: Share2, run: createShare },
            { id: "snapshots", label: "Version history", icon: History, run: () => setShowSnapshots(true), hint: "⌘S" },
            { id: "present", label: "Enter present mode", icon: Play, run: () => setPresenting(true) },
            { id: "print", label: "Print", icon: Printer, run: printDocument, hint: "⌘P" },
            { id: "fullscreen", label: fullscreen ? "Show chat panel" : "Hide chat panel", icon: fullscreen ? Minimize2 : Maximize2, run: () => setFullscreen((f) => !f) },
            ...Array.from({ length: previewPages }, (_, i) => ({
              id: `page-${i + 1}`,
              label: `Jump to page ${i + 1}`,
              icon: ChevronDown,
              run: () => scrollToPage(i + 1),
            })),
          ]}
        />
      )}
      {driveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 card p-4 flex items-start gap-3 shadow-lg"
          style={{ maxWidth: 360 }}
        >
          <Cloud size={18} className="text-[var(--color-cyan)] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold mb-1">Saved to your Drive</div>
            <div className="text-xs text-[var(--color-muted)] truncate">{driveToast.name}</div>
            {driveToast.link && (
              <a
                href={driveToast.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-cyan)] mt-2 underline-hover"
              >
                Open in Drive <ExternalLink size={12} />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDriveToast(null)}
            aria-label="Dismiss"
            className="text-[var(--color-muted)] hover:text-[var(--color-fg)]"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function ChatMessage({ turn }: { turn: Turn }) {
  const cleanContent = useMemo(() => {
    if (turn.role !== "assistant") return turn.content;
    return turn.content
      .replace(/```html\s*\n[\s\S]*?\n```/g, "")
      .replace(/```css\s*\n[\s\S]*?\n```/g, "")
      .trim() || "Updated.";
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

function ShareControls({
  shares,
  onCreate,
  onRevoke,
}: {
  shares: ShareLink[];
  onCreate: () => Promise<void>;
  onRevoke: (slug: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const link = shares[0];
  const url = link ? `${window.location.origin}/s/${link.slug}` : "";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(link!.slug);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost text-xs px-2 py-1"
        style={{ minHeight: 28, minWidth: 28 }}
        aria-label="Share"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Share2 size={13} />
        <span className="hidden sm:inline">{shares.length > 0 ? "Shared" : "Share"}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Share link" className="absolute right-0 top-full mt-1 w-80 card p-3 z-40 shadow-2xl">
          <h3 className="text-sm font-semibold mb-2">Public share link</h3>
          {!link ? (
            <>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                Anyone with the link can view a read-only preview.
              </p>
              <button
                onClick={async () => {
                  await onCreate();
                }}
                className="btn btn-primary w-full text-xs"
                style={{ minHeight: 36 }}
              >
                <Share2 size={13} /> Create link
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <input
                  readOnly
                  value={url}
                  aria-label="Share link URL"
                  className="input text-xs flex-1 min-w-0 py-1.5"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={copy}
                  className="btn btn-ghost text-xs px-2"
                  style={{ minHeight: 32, minWidth: 32 }}
                  aria-label="Copy link"
                >
                  {copied === link.slug ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-muted)]">{link.views} view{link.views === 1 ? "" : "s"}</span>
                <button
                  onClick={() => onRevoke(link.slug)}
                  className="text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                >
                  <Trash2 size={12} /> Revoke
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SnapshotDrawer({
  snapshots,
  onRestore,
  onClose,
}: {
  snapshots: Snapshot[];
  onRestore: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const trapRef = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshot-drawer-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className="card max-w-md w-full p-5 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="snapshot-drawer-title" className="font-semibold text-base">Version history</h2>
          <button
            autoFocus
            onClick={onClose}
            className="size-8 rounded-md hover:bg-white/5 grid place-items-center"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2 space-y-1">
          {snapshots.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] text-center py-6">No snapshots yet.</p>
          )}
          {snapshots.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onRestore(s.id)}
              className="w-full text-left p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-cyan)]/40 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate flex-1">{s.label || "Untitled"}</span>
                {i === 0 && (
                  <span className="text-xs text-[var(--color-cyan)] border border-[var(--color-cyan)]/40 rounded px-1.5 py-0.5 shrink-0">Current</span>
                )}
              </div>
              <div className="text-xs text-[var(--color-muted)] mt-0.5">
                {new Date(s.createdAt).toLocaleString()} · {s.pageSize}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UpgradeModal({
  onUpgrade,
  onClose,
}: {
  onUpgrade: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const feats = [
    "PDF export — real, text-selectable files",
    "Public share links with view counts",
    "Claude Opus 4.7 for complex documents",
    "10 projects (vs. 1 on free)",
  ];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className="card max-w-sm w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-[var(--color-cyan)]" />
            <h2 id="upgrade-modal-title" className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Upgrade to Pro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-md hover:bg-white/5 grid place-items-center"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-[var(--color-muted)] text-sm mb-5">
          This feature requires a Pro subscription.
        </p>
        <ul className="space-y-2 mb-6">
          {feats.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Zap size={14} className="text-[var(--color-cyan)] mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold">$9</span>
          <span className="text-[var(--color-muted)] text-sm">/ month · cancel anytime</span>
        </div>
        <button
          autoFocus
          onClick={async () => {
            setLoading(true);
            await onUpgrade();
            setLoading(false);
          }}
          disabled={loading}
          className="btn btn-primary w-full"
          style={{ minHeight: 44 }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
          Upgrade now
        </button>
      </div>
    </div>
  );
}

interface CommandAction {
  id: string;
  label: string;
  icon: typeof Command;
  run: () => void | Promise<void>;
  hint?: string;
  disabled?: boolean;
  group?: "action" | "navigation" | "shortcut";
}

const KEYBOARD_SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ["⌘", "K"], label: "Open command palette" },
  { keys: ["⌘", "Enter"], label: "Send chat message" },
  { keys: ["⌘", "\\"], label: "Toggle code panel" },
  { keys: ["⌘", "P"], label: "Print / Export PDF" },
  { keys: ["⌘", "."], label: "Toggle thumbnails rail" },
  { keys: ["⌘", "/"], label: "Slash commands in chat" },
  { keys: ["⌘", "S"], label: "Snapshot current version" },
  { keys: ["⌘", "Shift", "P"], label: "Toggle public / private" },
  { keys: ["⌘", "B"], label: "Bold (in CodeMirror)" },
  { keys: ["⌘", "Z"], label: "Undo last AI turn" },
  { keys: ["Esc"], label: "Close any modal or menu" },
];

function CommandPalette({
  onClose,
  actions,
}: {
  onClose: () => void;
  actions: CommandAction[];
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const trapRef = useFocusTrap<HTMLDivElement>();
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const action = filtered[activeIndex];
        if (!action || action.disabled) return;
        onClose();
        void action.run();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [filtered, activeIndex, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4 animate-[fadeIn_120ms_ease-out]"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d0d1a]/95 to-[#060610]/95 shadow-[0_30px_120px_-20px_rgba(0,229,255,0.25),0_10px_40px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-cyan)]/60 to-transparent"
        />
        <div className="flex items-center gap-3 px-4 border-b border-white/5">
          <Search size={18} className="text-[var(--color-cyan)] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions, shortcuts, navigation…"
            aria-label="Command search"
            className="flex-1 bg-transparent py-4 text-[15px] placeholder:text-[var(--color-muted)]/70 focus:outline-none"
          />
          <kbd className="text-[10px] text-[var(--color-muted)] border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div ref={listRef} role="listbox" className="max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-[var(--color-muted)]">
              No matching commands.
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--color-muted)]">
                Actions
              </div>
              {filtered.map((action, idx) => {
                const Icon = action.icon;
                const active = idx === activeIndex;
                return (
                  <button
                    key={action.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-cmd-idx={idx}
                    disabled={action.disabled}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (action.disabled) return;
                      onClose();
                      void action.run();
                    }}
                    className={`group w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      active
                        ? "bg-gradient-to-r from-[var(--color-cyan)]/10 to-transparent"
                        : "hover:bg-white/[0.03]"
                    } ${action.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                        active ? "bg-[var(--color-cyan)]/15" : "bg-white/[0.03]"
                      }`}
                    >
                      <Icon size={15} className="text-[var(--color-cyan)] shrink-0" />
                    </span>
                    <span className="flex-1 truncate font-medium">{action.label}</span>
                    {action.hint && (
                      <kbd className="text-[10px] text-[var(--color-muted)] border border-white/10 rounded px-1.5 py-0.5 shrink-0 font-mono">
                        {action.hint}
                      </kbd>
                    )}
                  </button>
                );
              })}
              {!query.trim() && (
                <>
                  <div className="mt-3 px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--color-muted)] border-t border-white/5">
                    Keyboard shortcuts
                  </div>
                  <div className="px-2 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5">
                    {KEYBOARD_SHORTCUTS.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md hover:bg-white/[0.02]"
                      >
                        <span className="text-xs text-[var(--color-muted)] truncate">{s.label}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {s.keys.map((k) => (
                            <kbd
                              key={k}
                              className="text-[10px] font-mono text-[var(--color-fg)]/80 border border-white/10 bg-white/[0.03] rounded px-1.5 py-0.5 min-w-[20px] text-center"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-white/[0.02] text-[11px] text-[var(--color-muted)]">
          <span className="flex items-center gap-2">
            <kbd className="text-[10px] border border-white/10 rounded px-1 py-0.5 font-mono">↑↓</kbd>
            <span>navigate</span>
            <kbd className="text-[10px] border border-white/10 rounded px-1 py-0.5 font-mono">↵</kbd>
            <span>run</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
            <span>Megabyte PDF</span>
          </span>
        </div>
      </div>
    </div>
  );
}

const SLASH_COMMANDS: Array<{ slug: string; label: string; template: string; hint: string }> = [
  { slug: "shorten", label: "/shorten", template: "Shorten this document by 30% without losing key facts.", hint: "Tighter copy" },
  { slug: "professional", label: "/professional", template: "Rewrite in a confident, formal tone suitable for executives.", hint: "Formal tone" },
  { slug: "casual", label: "/casual", template: "Rewrite in a friendly, conversational tone.", hint: "Friendly tone" },
  { slug: "fix-grammar", label: "/fix-grammar", template: "Fix all grammar, spelling, and punctuation issues. Do not change meaning.", hint: "Proofread" },
  { slug: "summarize", label: "/summarize", template: "Add a 3-sentence executive summary at the top.", hint: "Executive summary" },
  { slug: "bullets", label: "/bullets", template: "Convert dense paragraphs into clear bulleted lists where appropriate.", hint: "Bulleted lists" },
  { slug: "translate-es", label: "/translate-es", template: "Translate the entire document to Spanish, preserving layout.", hint: "Translate → Spanish" },
  { slug: "translate-fr", label: "/translate-fr", template: "Translate the entire document to French, preserving layout.", hint: "Translate → French" },
  { slug: "add-cover", label: "/add-cover", template: "Add a striking cover page with a bold title, subtitle, and date.", hint: "Add cover page" },
  { slug: "add-toc", label: "/add-toc", template: "Add a table of contents listing all main sections with page numbers.", hint: "Add table of contents" },
  { slug: "callouts", label: "/callouts", template: "Highlight key insights with styled callout boxes.", hint: "Callout boxes" },
  { slug: "stats", label: "/stats", template: "Add a stats row near the top with 3-4 key numbers from this document.", hint: "Stats row" },
];

function SlashMenu({
  message,
  onSelect,
}: {
  message: string;
  onSelect: (text: string) => void;
}) {
  const trimmed = message.trimStart();
  const showing = trimmed.startsWith("/");
  const query = showing ? (trimmed.slice(1).split(/\s/)[0] ?? "").toLowerCase() : "";
  const matches = showing
    ? SLASH_COMMANDS.filter((c) => c.slug.startsWith(query)).slice(0, 6)
    : [];
  if (!showing || matches.length === 0) return null;
  return (
    <div
      role="listbox"
      aria-label="Slash commands"
      className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)] shadow-lg overflow-hidden z-20"
    >
      {matches.map((c) => (
        <button
          key={c.slug}
          type="button"
          role="option"
          aria-selected="false"
          onClick={() => {
            onSelect(c.template);
            captureEvent("editor_slash_command", { slug: c.slug });
          }}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/[0.04] border-b border-[var(--color-line)] last:border-b-0"
        >
          <span className="text-xs font-mono text-[var(--color-cyan)]">{c.label}</span>
          <span className="text-xs text-[var(--color-muted)] truncate">{c.hint}</span>
        </button>
      ))}
    </div>
  );
}

