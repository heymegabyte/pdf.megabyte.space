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
  Briefcase,
  Scale,
  User,
  Megaphone,
  Palette,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Star,
  Clock,
  Keyboard,
  Target,
  ChevronRight,
  FileText,
  Eraser,
  StopCircle,
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
  const [tone, setTone] = useState<TonePreset>(() => {
    if (typeof window === "undefined") return "default";
    return (window.localStorage.getItem("megabyte-pdf:tone") as TonePreset) || "default";
  });
  const [pageTarget, setPageTarget] = useState<number | "all">("all");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState<keyof typeof PROMPT_GALLERY>("business");
  const [reactions, setReactions] = useState<Record<string, "up" | "down" | null>>({});
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [pinnedPrompts, setPinnedPrompts] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("megabyte-pdf:pins") || "[]"); } catch { return []; }
  });
  const [promptHistory, setPromptHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("megabyte-pdf:history") || "[]"); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [stage, setStage] = useState<"idle" | "reading" | "planning" | "drafting" | "done">("idle");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const liveHtmlRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRecRef = useRef<SpeechRecognitionLike | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const composedMessage = useMemo(
    () => composeMessage(message, tone, pageTarget),
    [message, tone, pageTarget],
  );

  const costEstimate = useMemo(() => estimateCost(message, model), [message, model]);

  useEffect(() => {
    try { window.localStorage.setItem("megabyte-pdf:tone", tone); } catch { /* noop */ }
  }, [tone]);

  useEffect(() => {
    try { window.localStorage.setItem("megabyte-pdf:pins", JSON.stringify(pinnedPrompts.slice(0, 12))); } catch { /* noop */ }
  }, [pinnedPrompts]);

  useEffect(() => {
    try { window.localStorage.setItem("megabyte-pdf:history", JSON.stringify(promptHistory.slice(0, 10))); } catch { /* noop */ }
  }, [promptHistory]);

  useEffect(() => {
    if (!sending) {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
      setStage("idle");
      return;
    }
    setStage("reading");
    const t1 = setTimeout(() => setStage("planning"), 1200);
    const t2 = setTimeout(() => setStage("drafting"), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [sending]);

  // ⌘/ to focus textarea, ⌘? to show shortcut overlay (palette)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "/") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      if (meta && e.shiftKey && e.key === "?") {
        e.preventDefault();
        setShowPalette(true);
      }
      if (meta && e.key === "f" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setShowChatSearch((s) => !s);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const startVoiceInput = useCallback(() => {
    setVoiceError(null);
    const win = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("Voice input unsupported in this browser.");
      return;
    }
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let txt = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript;
        if (transcript) txt += transcript;
      }
      setMessage((prev) => (prev ? `${prev.trim()} ${txt}` : txt));
    };
    rec.onend = () => { setListening(false); };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setVoiceError(e.error === "not-allowed" ? "Microphone permission denied." : "Voice input failed.");
      setListening(false);
    };
    speechRecRef.current = rec;
    setListening(true);
    rec.start();
    captureEvent("editor_voice_start");
  }, []);

  const stopVoiceInput = useCallback(() => {
    speechRecRef.current?.stop();
    setListening(false);
  }, []);

  const togglePin = useCallback((prompt: string) => {
    setPinnedPrompts((prev) => {
      if (prev.includes(prompt)) return prev.filter((p) => p !== prompt);
      return [prompt, ...prev].slice(0, 12);
    });
  }, []);

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

  async function send(overrideText?: string) {
    const baseText = (overrideText ?? message).trim();
    if (!baseText || !id || sending) return;
    const text = composeMessage(baseText, tone, pageTarget);
    // Flush any pending inline edits to server so AI sees latest content
    await syncInlineEdits();
    setSending(true);
    setError(null);
    if (!overrideText) setMessage("");
    setPromptHistory((prev) => [baseText, ...prev.filter((p) => p !== baseText)].slice(0, 10));
    const optimisticTurn: Turn = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setData((d) => (d ? { ...d, turns: [...d.turns, optimisticTurn] } : d));
    playSound("send");
    captureEvent("editor_chat_send", { model, messageLength: text.length, tone, page_target: pageTarget });
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

  function regenerateLast() {
    if (!data || sending) return;
    const userTurns = data.turns.filter((t) => t.role === "user");
    const last = userTurns[userTurns.length - 1];
    if (!last) return;
    captureEvent("editor_regenerate_last");
    void send(stripComposedPrefixSuffix(last.content));
  }

  function reactTo(turnId: string, value: "up" | "down") {
    setReactions((prev) => ({ ...prev, [turnId]: prev[turnId] === value ? null : value }));
    captureEvent("editor_chat_reaction", { value });
  }

  function continueDraft() {
    if (sending) return;
    void send("Continue the draft from where it leaves off. Match the existing tone, structure, and visual style.");
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
        {!fullscreen && !cinema && <aside data-cinema-hide className="border-r border-[var(--color-line)] flex flex-col bg-[var(--color-bg-elev)] min-h-0 relative">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-[var(--color-line)]/60">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-7 rounded-lg grid place-items-center bg-gradient-to-br from-[var(--color-cyan)]/25 to-[var(--color-violet)]/25 ring-1 ring-[var(--color-cyan)]/30">
                <Sparkles size={14} className="text-[var(--color-cyan)]" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-wide">AI Designer</div>
                <div className="text-[10px] text-[var(--color-muted)] truncate">
                  {sending ? <StagePill stage={stage} /> : `${data.turns.length} message${data.turns.length === 1 ? "" : "s"} · ${previewPages}p`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowChatSearch((s) => !s)}
                aria-label="Search chat"
                title="Search chat (⌘F)"
                className={`size-7 rounded-md grid place-items-center ${showChatSearch ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]" : "text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]"}`}
              >
                <Search size={13} />
              </button>
              <button
                onClick={() => setShowPins((s) => !s)}
                aria-label="Pinned prompts"
                title="Pinned prompts"
                className={`size-7 rounded-md grid place-items-center ${showPins ? "bg-amber-400/15 text-amber-300" : "text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]"}`}
              >
                <Star size={13} className={pinnedPrompts.length > 0 ? "fill-current" : ""} />
              </button>
              <button
                onClick={() => setShowHistory((s) => !s)}
                aria-label="Prompt history"
                title="Recent prompts"
                className={`size-7 rounded-md grid place-items-center ${showHistory ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]" : "text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]"}`}
              >
                <Clock size={13} />
              </button>
              <button
                onClick={() => setShowPalette(true)}
                aria-label="Keyboard shortcuts"
                title="Shortcuts (⌘?)"
                className="size-7 rounded-md grid place-items-center text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]"
              >
                <Keyboard size={13} />
              </button>
            </div>
          </div>

          {showChatSearch && (
            <div className="px-4 py-2 border-b border-[var(--color-line)]/60 bg-[var(--color-bg)]/60">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="search"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Find in chat…"
                  aria-label="Search chat messages"
                  className="input text-xs pl-7 py-1.5 w-full"
                  autoFocus
                />
              </div>
            </div>
          )}

          {showPins && pinnedPrompts.length > 0 && (
            <div className="px-3 py-2 border-b border-[var(--color-line)]/60 bg-amber-400/[0.03]">
              <div className="text-[10px] uppercase tracking-wider text-amber-300/70 mb-1.5 flex items-center gap-1">
                <Star size={9} className="fill-current" /> Pinned
              </div>
              <div className="flex flex-wrap gap-1">
                {pinnedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setMessage(p); textareaRef.current?.focus(); }}
                    className="text-[11px] px-2 py-1 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-200/90 hover:bg-amber-400/15 max-w-[200px] truncate"
                    title={p}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPinnedPrompts([])}
                  className="text-[11px] px-2 py-1 rounded-md text-[var(--color-muted)] hover:text-red-300"
                  title="Clear pins"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          )}

          {showHistory && promptHistory.length > 0 && (
            <div className="px-3 py-2 border-b border-[var(--color-line)]/60 bg-[var(--color-bg)]/40">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5">Recent</div>
              <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto scrollbar-thin">
                {promptHistory.map((p, i) => (
                  <div key={`${p}-${i}`} className="group flex items-center gap-1">
                    <button
                      onClick={() => { setMessage(p); textareaRef.current?.focus(); setShowHistory(false); }}
                      className="flex-1 text-left text-[11px] px-2 py-1 rounded-md hover:bg-white/[0.04] text-[var(--color-fg)]/80 truncate"
                      title={p}
                    >
                      {p}
                    </button>
                    <button
                      onClick={() => togglePin(p)}
                      className="size-5 rounded grid place-items-center text-[var(--color-muted)] opacity-0 group-hover:opacity-100 hover:text-amber-300"
                      aria-label={pinnedPrompts.includes(p) ? "Unpin" : "Pin"}
                    >
                      <Star size={10} className={pinnedPrompts.includes(p) ? "fill-current text-amber-300" : ""} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={chatScrollRef} role="log" aria-live="polite" aria-label="Chat messages" className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
            {data.turns.length === 0 && !sending && (
              <PromptGallery
                category={galleryCategory}
                onCategory={setGalleryCategory}
                onPick={(prompt) => {
                  setMessage(prompt);
                  captureEvent("editor_starter_prompt", { prompt, category: galleryCategory });
                  setTimeout(() => textareaRef.current?.focus(), 0);
                }}
              />
            )}
            {data.turns
              .filter((t) => !chatSearch.trim() || t.content.toLowerCase().includes(chatSearch.toLowerCase()))
              .map((turn, idx, arr) => (
                <ChatMessage
                  key={turn.id}
                  turn={turn}
                  isLast={idx === arr.length - 1}
                  reaction={reactions[turn.id] ?? null}
                  onReact={(v) => reactTo(turn.id, v)}
                  onRegenerate={turn.role === "assistant" && idx === arr.length - 1 ? regenerateLast : undefined}
                  onPin={togglePin}
                  isPinned={(p) => pinnedPrompts.includes(p)}
                />
              ))}
            {sending && (
              <div className="flex items-start gap-2">
                <div className="size-7 rounded-full bg-gradient-to-br from-[var(--color-cyan)]/30 to-[var(--color-violet)]/30 grid place-items-center shrink-0 mt-0.5">
                  <Loader2 size={14} className="animate-spin text-[var(--color-cyan)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <StageTimeline stage={stage} />
                </div>
              </div>
            )}
            {!sending && data.turns.length > 0 && data.turns[data.turns.length - 1]?.role === "assistant" && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={continueDraft}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-line)] hover:border-[var(--color-cyan)]/40 hover:bg-white/[0.03] inline-flex items-center gap-1 text-[var(--color-fg)]/80"
                >
                  <ChevronRight size={10} className="text-[var(--color-cyan)]" /> Continue
                </button>
                <button
                  onClick={regenerateLast}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-line)] hover:border-[var(--color-cyan)]/40 hover:bg-white/[0.03] inline-flex items-center gap-1 text-[var(--color-fg)]/80"
                >
                  <RotateCcw size={10} className="text-[var(--color-cyan)]" /> Regenerate
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-line)] p-3 bg-[var(--color-bg)] space-y-2">
            {voiceError && (
              <div role="alert" className="text-[11px] px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-300 flex items-center justify-between gap-2">
                <span className="truncate">{voiceError}</span>
                <button onClick={() => setVoiceError(null)} aria-label="Dismiss"><X size={10} /></button>
              </div>
            )}
            <div className="flex items-center gap-1.5 flex-wrap" role="toolbar" aria-label="Compose options">
              <details className="relative">
                <summary className="text-[11px] px-2 py-1 rounded-md border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)] cursor-pointer inline-flex items-center gap-1 list-none">
                  <Palette size={10} /> {TONE_LABEL[tone]}
                </summary>
                <div className="absolute z-30 bottom-full mb-1 left-0 card p-1 min-w-[160px] shadow-2xl">
                  {(Object.keys(TONE_LABEL) as TonePreset[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`w-full text-left text-xs px-2 py-1 rounded-md ${tone === t ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]" : "text-[var(--color-fg)]/80 hover:bg-white/5"}`}
                    >
                      {TONE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </details>
              {previewPages > 1 && (
                <details className="relative">
                  <summary className="text-[11px] px-2 py-1 rounded-md border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)] cursor-pointer inline-flex items-center gap-1 list-none">
                    <Target size={10} /> {pageTarget === "all" ? "All pages" : `Page ${pageTarget}`}
                  </summary>
                  <div className="absolute z-30 bottom-full mb-1 left-0 card p-1 max-h-48 overflow-y-auto scrollbar-thin min-w-[140px] shadow-2xl">
                    <button onClick={() => setPageTarget("all")} className={`w-full text-left text-xs px-2 py-1 rounded-md ${pageTarget === "all" ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]" : "text-[var(--color-fg)]/80 hover:bg-white/5"}`}>All pages</button>
                    {Array.from({ length: previewPages }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => setPageTarget(n)} className={`w-full text-left text-xs px-2 py-1 rounded-md ${pageTarget === n ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]" : "text-[var(--color-fg)]/80 hover:bg-white/5"}`}>Page {n}</button>
                    ))}
                  </div>
                </details>
              )}
              <button
                onClick={() => setModel(model === "sonnet" ? "opus" : "sonnet")}
                aria-label={`Model: ${model}`}
                title="Toggle model"
                className={`text-[11px] px-2 py-1 rounded-md border inline-flex items-center gap-1 ${model === "opus" ? "border-[var(--color-violet)]/40 text-[var(--color-violet)] bg-[var(--color-violet)]/10" : "border-[var(--color-cyan)]/40 text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"}`}
              >
                {model === "opus" ? <Crown size={10} /> : <Zap size={10} />}
                {model === "opus" ? "Opus" : "Sonnet"}
              </button>
              <span className="text-[10px] text-[var(--color-muted)] ml-auto tabular-nums" title="Estimated input cost">
                ~${costEstimate.toFixed(3)}
              </span>
            </div>
            {data.turns.length === 0 && (
              <button
                onClick={() => setShowGallery((s) => !s)}
                className="w-full text-[11px] px-2 py-1.5 rounded-md border border-dashed border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-cyan)]/40 inline-flex items-center justify-center gap-1"
              >
                <LayoutTemplate size={11} /> {showGallery ? "Hide" : "Browse"} 25 templates
              </button>
            )}
            {suggestions.length > 0 && message.length === 0 && !sending && data.turns.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Suggested next prompts">
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
                  if (e.key === "ArrowUp" && !message && promptHistory.length > 0) {
                    e.preventDefault();
                    const first = promptHistory[0];
                    if (first) setMessage(first);
                  }
                }}
                placeholder={listening ? "Listening…" : "Describe a change… (try / for commands, ⌘+Enter to send)"}
                aria-label="Chat message"
                className="input resize-none pr-24 pb-7 text-sm"
                style={{ minHeight: 64, maxHeight: 200, overflowY: "auto" }}
                disabled={sending}
              />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] tabular-nums ${message.length > 7000 ? "text-amber-400" : message.length > 7600 ? "text-red-400" : "text-[var(--color-muted)]"}`}>
                    {message.length > 0 ? `${message.length}/8000` : ""}
                  </span>
                  {message.trim() && (
                    <button
                      onClick={() => togglePin(message.trim())}
                      className="pointer-events-auto text-[10px] text-[var(--color-muted)] hover:text-amber-300 inline-flex items-center gap-0.5"
                      title="Pin this prompt"
                      type="button"
                    >
                      <Star size={9} className={pinnedPrompts.includes(message.trim()) ? "fill-current text-amber-300" : ""} />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-muted)] hidden sm:inline opacity-60">
                  {composedMessage !== message.trim() && message.trim() && "Tone+target applied"}
                </span>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-auto">
                {message.trim() && !sending && (
                  <button
                    onClick={() => setMessage("")}
                    aria-label="Clear"
                    title="Clear"
                    className="size-7 rounded-md grid place-items-center text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]"
                  >
                    <Eraser size={13} />
                  </button>
                )}
                <button
                  onClick={listening ? stopVoiceInput : startVoiceInput}
                  aria-label={listening ? "Stop listening" : "Voice input"}
                  title={listening ? "Stop listening" : "Voice input"}
                  className={`size-7 rounded-md grid place-items-center ${listening ? "bg-red-500/20 text-red-300 ring-2 ring-red-500/40 animate-pulse" : "text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]"}`}
                >
                  {listening ? <MicOff size={13} /> : <Mic size={13} />}
                </button>
                <button
                  onClick={() => void send()}
                  disabled={!message.trim() || sending}
                  className="size-9 rounded-lg bg-gradient-to-br from-[var(--color-cyan)] to-[#0ea5b7] text-[#060610] grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 shadow-[0_4px_12px_-2px_rgba(0,229,255,0.4)]"
                  aria-label="Send (⌘+Enter)"
                  title="Send (⌘+Enter)"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
            {sending && (
              <button
                onClick={() => { setSending(false); setStage("idle"); }}
                className="w-full text-[11px] px-2 py-1.5 rounded-md border border-red-500/20 text-red-300/80 hover:bg-red-500/10 inline-flex items-center justify-center gap-1"
                aria-label="Stop generating"
              >
                <StopCircle size={11} /> Stop
              </button>
            )}
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

function ChatMessage({
  turn,
  isLast,
  reaction,
  onReact,
  onRegenerate,
  onPin,
  isPinned,
}: {
  turn: Turn;
  isLast?: boolean;
  reaction?: "up" | "down" | null;
  onReact?: (v: "up" | "down") => void;
  onRegenerate?: () => void;
  onPin?: (text: string) => void;
  isPinned?: (text: string) => boolean;
}) {
  const [copied, setCopied] = useState(false);
  const cleanContent = useMemo(() => {
    if (turn.role !== "assistant") return stripComposedPrefixSuffix(turn.content);
    return turn.content
      .replace(/```html\s*\n[\s\S]*?\n```/g, "")
      .replace(/```css\s*\n[\s\S]*?\n```/g, "")
      .trim() || "Updated.";
  }, [turn.content, turn.role]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }

  if (turn.role === "user") {
    const pinned = isPinned?.(cleanContent) ?? false;
    return (
      <div className="flex justify-end group">
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 bg-gradient-to-br from-[var(--color-cyan)]/15 to-[var(--color-blue)]/10 border border-[var(--color-cyan)]/20 text-sm whitespace-pre-wrap break-words shadow-[0_1px_8px_-2px_rgba(0,229,255,0.15)]">
            {cleanContent}
          </div>
          <div className="flex justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPin && (
              <button
                onClick={() => onPin(cleanContent)}
                className="size-5 rounded grid place-items-center text-[var(--color-muted)] hover:text-amber-300"
                aria-label={pinned ? "Unpin prompt" : "Pin prompt"}
                title={pinned ? "Unpin" : "Pin"}
              >
                <Star size={10} className={pinned ? "fill-current text-amber-300" : ""} />
              </button>
            )}
            <button onClick={copy} className="size-5 rounded grid place-items-center text-[var(--color-muted)] hover:text-[var(--color-fg)]" aria-label="Copy" title="Copy">
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 group">
      <div className="size-7 rounded-full bg-gradient-to-br from-[var(--color-cyan)]/25 to-[var(--color-violet)]/20 grid place-items-center text-[var(--color-cyan)] shrink-0 mt-0.5 ring-1 ring-[var(--color-cyan)]/30">
        <Sparkles size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm whitespace-pre-wrap break-words text-[var(--color-fg)]/90">
          {cleanContent}
        </div>
        <div className={`flex items-center gap-0.5 mt-1.5 transition-opacity ${isLast ? "opacity-70" : "opacity-0 group-hover:opacity-70"} hover:opacity-100`}>
          <button
            onClick={copy}
            className="size-6 rounded grid place-items-center text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-white/5"
            aria-label="Copy message"
            title="Copy"
          >
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          </button>
          {onReact && (
            <>
              <button
                onClick={() => onReact("up")}
                className={`size-6 rounded grid place-items-center hover:bg-white/5 ${reaction === "up" ? "text-green-400" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"}`}
                aria-label="Helpful"
                title="Helpful"
              >
                <ThumbsUp size={11} className={reaction === "up" ? "fill-current" : ""} />
              </button>
              <button
                onClick={() => onReact("down")}
                className={`size-6 rounded grid place-items-center hover:bg-white/5 ${reaction === "down" ? "text-red-400" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"}`}
                aria-label="Not helpful"
                title="Not helpful"
              >
                <ThumbsDown size={11} className={reaction === "down" ? "fill-current" : ""} />
              </button>
            </>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="size-6 rounded grid place-items-center text-[var(--color-muted)] hover:text-[var(--color-cyan)] hover:bg-white/5"
              aria-label="Regenerate"
              title="Regenerate"
            >
              <RotateCcw size={11} />
            </button>
          )}
          <span className="text-[10px] text-[var(--color-muted)]/60 ml-auto tabular-nums">
            {formatTimeAgo(turn.createdAt)}
          </span>
        </div>
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

const SLASH_COMMANDS: Array<{ slug: string; label: string; template: string; hint: string; group: string }> = [
  // Rewrites
  { slug: "shorten", label: "/shorten", template: "Shorten this document by 30% without losing key facts.", hint: "Tighter copy", group: "Rewrite" },
  { slug: "expand", label: "/expand", template: "Expand each section with one extra sentence of supporting detail.", hint: "Add depth", group: "Rewrite" },
  { slug: "professional", label: "/professional", template: "Rewrite in a confident, formal tone suitable for executives.", hint: "Formal tone", group: "Rewrite" },
  { slug: "casual", label: "/casual", template: "Rewrite in a friendly, conversational tone.", hint: "Friendly tone", group: "Rewrite" },
  { slug: "concise", label: "/concise", template: "Tighten every sentence. Remove filler. Active voice only.", hint: "Active voice", group: "Rewrite" },
  { slug: "playful", label: "/playful", template: "Add personality and warmth without losing professionalism.", hint: "More personality", group: "Rewrite" },
  { slug: "academic", label: "/academic", template: "Rewrite in a scholarly, citation-friendly tone with hedged claims.", hint: "Academic register", group: "Rewrite" },
  { slug: "legal", label: "/legal", template: "Rewrite in clear legal English: numbered clauses, defined terms, precise scope.", hint: "Legal voice", group: "Rewrite" },
  // Fixes
  { slug: "fix-grammar", label: "/fix-grammar", template: "Fix all grammar, spelling, and punctuation issues. Do not change meaning.", hint: "Proofread", group: "Polish" },
  { slug: "fix-numbers", label: "/fix-numbers", template: "Audit every number, total, percentage, and date for arithmetic and consistency. Fix mistakes inline.", hint: "Number audit", group: "Polish" },
  { slug: "balance", label: "/balance", template: "Balance content evenly across pages. Avoid orphans and widows.", hint: "Page balance", group: "Polish" },
  { slug: "consistency", label: "/consistency", template: "Make heading levels, terminology, and capitalization perfectly consistent.", hint: "Style consistency", group: "Polish" },
  // Structure
  { slug: "summarize", label: "/summarize", template: "Add a 3-sentence executive summary at the top.", hint: "Executive summary", group: "Structure" },
  { slug: "bullets", label: "/bullets", template: "Convert dense paragraphs into clear bulleted lists where appropriate.", hint: "Bulleted lists", group: "Structure" },
  { slug: "tldr", label: "/tldr", template: "Add a 'TL;DR' callout at the top in 2 sentences.", hint: "TL;DR callout", group: "Structure" },
  { slug: "outline", label: "/outline", template: "Restructure with H1/H2/H3 hierarchy and short intro under each heading.", hint: "Reorganize headings", group: "Structure" },
  { slug: "headings", label: "/headings", template: "Rewrite every heading for clarity and parallel structure.", hint: "Stronger headings", group: "Structure" },
  // Blocks
  { slug: "add-cover", label: "/add-cover", template: "Add a striking cover page with a bold title, subtitle, and date.", hint: "Add cover page", group: "Blocks" },
  { slug: "add-toc", label: "/add-toc", template: "Add a table of contents listing all main sections with page numbers.", hint: "Add table of contents", group: "Blocks" },
  { slug: "add-signature", label: "/add-signature", template: "Add a signature block with lines for both parties, date, and printed name.", hint: "Signature block", group: "Blocks" },
  { slug: "add-references", label: "/add-references", template: "Add a references / citations section in APA 7th edition format.", hint: "References", group: "Blocks" },
  { slug: "add-cta", label: "/add-cta", template: "Add a clear call-to-action block with contact details and a next step.", hint: "Call-to-action", group: "Blocks" },
  { slug: "callouts", label: "/callouts", template: "Highlight key insights with styled callout boxes.", hint: "Callout boxes", group: "Blocks" },
  { slug: "stats", label: "/stats", template: "Add a stats row near the top with 3-4 key numbers from this document.", hint: "Stats row", group: "Blocks" },
  { slug: "footer", label: "/footer", template: "Add a clean footer with page numbers, document title, and confidentiality notice.", hint: "Footer", group: "Blocks" },
  { slug: "qr", label: "/qr", template: "Add a QR code linking to the source document URL in the footer.", hint: "QR code", group: "Blocks" },
  // Design
  { slug: "redesign", label: "/redesign", template: "Redesign with a more modern, editorial layout. Strong typography, generous whitespace.", hint: "Editorial redesign", group: "Design" },
  { slug: "monochrome", label: "/monochrome", template: "Convert to an elegant monochrome palette (black + one accent).", hint: "Mono palette", group: "Design" },
  { slug: "brand", label: "/brand", template: "Apply a brand color palette: primary, accent, and a neutral. Suggest hexes.", hint: "Brand colors", group: "Design" },
  { slug: "two-column", label: "/two-column", template: "Restructure dense pages into a two-column layout for readability.", hint: "Two columns", group: "Design" },
  { slug: "serif", label: "/serif", template: "Switch body type to a serif and headings to a complementary sans.", hint: "Serif body", group: "Design" },
  // Translate
  { slug: "translate-es", label: "/translate-es", template: "Translate the entire document to Spanish, preserving layout.", hint: "→ Spanish", group: "Translate" },
  { slug: "translate-fr", label: "/translate-fr", template: "Translate the entire document to French, preserving layout.", hint: "→ French", group: "Translate" },
  { slug: "translate-de", label: "/translate-de", template: "Translate the entire document to German, preserving layout.", hint: "→ German", group: "Translate" },
  { slug: "translate-jp", label: "/translate-jp", template: "Translate the entire document to Japanese, preserving layout.", hint: "→ Japanese", group: "Translate" },
  { slug: "translate-pt", label: "/translate-pt", template: "Translate the entire document to Brazilian Portuguese, preserving layout.", hint: "→ Portuguese", group: "Translate" },
];

function SlashMenu({
  message,
  onSelect,
}: {
  message: string;
  onSelect: (text: string) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const trimmed = message.trimStart();
  const showing = trimmed.startsWith("/");
  const query = showing ? (trimmed.slice(1).split(/\s/)[0] ?? "").toLowerCase() : "";
  const matches = useMemo(
    () => (showing ? SLASH_COMMANDS.filter((c) => c.slug.includes(query) || c.hint.toLowerCase().includes(query)).slice(0, 8) : []),
    [showing, query],
  );

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    if (!showing || matches.length === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(matches.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Tab" || (e.key === "Enter" && !e.metaKey && !e.ctrlKey)) {
        const m = matches[activeIdx];
        if (m) {
          e.preventDefault();
          onSelect(m.template);
          captureEvent("editor_slash_command", { slug: m.slug });
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showing, matches, activeIdx, onSelect]);

  if (!showing || matches.length === 0) return null;

  // Group matches by group label
  const groups = matches.reduce<Record<string, typeof matches>>((acc, m) => {
    (acc[m.group] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div
      role="listbox"
      aria-label="Slash commands"
      className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[var(--color-line)] bg-gradient-to-b from-[#0d0d1a]/98 to-[var(--color-bg-elev)] shadow-2xl overflow-hidden z-20 max-h-72 overflow-y-auto scrollbar-thin"
    >
      <div className="px-3 py-1.5 border-b border-[var(--color-line)]/60 text-[10px] uppercase tracking-wider text-[var(--color-muted)] flex items-center justify-between">
        <span>Slash commands — {matches.length} match{matches.length === 1 ? "" : "es"}</span>
        <span className="opacity-60">↑↓ navigate · ↵ pick</span>
      </div>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="px-3 pt-1.5 pb-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--color-cyan)]/70 font-semibold">{group}</div>
          {items.map((c) => {
            const globalIdx = matches.indexOf(c);
            const isActive = globalIdx === activeIdx;
            return (
              <button
                key={c.slug}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIdx(globalIdx)}
                onClick={() => {
                  onSelect(c.template);
                  captureEvent("editor_slash_command", { slug: c.slug });
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left ${isActive ? "bg-[var(--color-cyan)]/10" : "hover:bg-white/[0.03]"}`}
              >
                <span className={`text-xs font-mono ${isActive ? "text-[var(--color-cyan)]" : "text-[var(--color-cyan)]/80"}`}>{c.label}</span>
                <span className="text-[11px] text-[var(--color-muted)] truncate">{c.hint}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type TonePreset = "default" | "professional" | "casual" | "concise" | "detailed" | "playful" | "academic";

const TONE_LABEL: Record<TonePreset, string> = {
  default: "Tone: default",
  professional: "Professional",
  casual: "Casual",
  concise: "Concise",
  detailed: "Detailed",
  playful: "Playful",
  academic: "Academic",
};

const TONE_PREFIX: Record<TonePreset, string> = {
  default: "",
  professional: "[Tone: confident, formal, suitable for executives.]\n\n",
  casual: "[Tone: friendly, conversational, plain English.]\n\n",
  concise: "[Tone: extremely concise. Cut filler. Active voice.]\n\n",
  detailed: "[Tone: thorough. Add depth, context, supporting detail.]\n\n",
  playful: "[Tone: warm, witty, human. Keep it professional.]\n\n",
  academic: "[Tone: scholarly, citation-friendly, hedged claims.]\n\n",
};

const TONE_MARKER_RE = /^\[Tone: [^\]]+\]\s*\n+/;
const PAGE_MARKER_RE = /\n*\[Apply only to page \d+\.\]$/;
const PAGES_ALL_RE = /\n*\[Apply across all pages\.\]$/;

function composeMessage(text: string, tone: TonePreset, pageTarget: number | "all"): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const prefix = TONE_PREFIX[tone];
  const suffix = pageTarget === "all" ? "" : `\n\n[Apply only to page ${pageTarget}.]`;
  return `${prefix}${trimmed}${suffix}`;
}

function stripComposedPrefixSuffix(text: string): string {
  return text.replace(TONE_MARKER_RE, "").replace(PAGE_MARKER_RE, "").replace(PAGES_ALL_RE, "").trim();
}

function estimateCost(text: string, model: "sonnet" | "opus"): number {
  // Rough heuristic: text tokens ≈ chars/4. Doc context adds ~6k tokens average.
  const messageTokens = Math.ceil(text.length / 4);
  const inputTokens = messageTokens + 6000;
  const outputTokens = 1500; // typical assistant turn
  // Anthropic public pricing (per 1M tokens, May 2026): Sonnet 4.6 $3/$15, Opus 4.7 $15/$75
  if (model === "opus") {
    return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
  }
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionResultLike {
  length: number;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultsLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultsLike;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

const PROMPT_GALLERY = {
  business: {
    label: "Business",
    icon: Briefcase,
    accent: "var(--color-cyan)",
    prompts: [
      { title: "Invoice", body: "Invoice for $4,200 to Acme Corp from Brian Z., NET 14, with itemized services and bank details." },
      { title: "Proposal", body: "Three-page proposal for a $48k consulting engagement. Cover, scope, milestones, pricing, sign-off." },
      { title: "Statement of Work", body: "Statement of Work for a 12-week mobile app build: scope, deliverables, milestones, acceptance criteria, payment schedule." },
      { title: "Quarterly report", body: "Quarterly business report with KPI dashboard, highlights, financial summary, and goals for next quarter." },
      { title: "Pitch deck cover", body: "Striking pitch-deck cover page for a Series A pre-revenue startup in climate tech. Bold typography, tagline, founder name." },
    ],
  },
  legal: {
    label: "Legal",
    icon: Scale,
    accent: "var(--color-violet)",
    prompts: [
      { title: "Mutual NDA", body: "Mutual NDA between two startups — clean, professional, 2 pages, mutual obligations, 2-year term, governed by Delaware law." },
      { title: "Service agreement", body: "Service agreement for a $24k design retainer. Scope, IP assignment, termination, indemnity, signatures." },
      { title: "Employment offer", body: "Employment offer letter for a senior engineer: $185k base, equity, benefits, start date, at-will language, signature block." },
      { title: "Cease & desist", body: "Cease and desist letter regarding unauthorized use of a registered trademark. Firm, factual, 1 page, 14-day demand." },
      { title: "Privacy policy", body: "Plain-English privacy policy for a SaaS product: data collection, use, sharing, user rights, retention, contact." },
    ],
  },
  personal: {
    label: "Personal",
    icon: User,
    accent: "var(--color-blue)",
    prompts: [
      { title: "Resume", body: "One-page resume for a senior software engineer in New York with 8 years experience. Modern, clean, ATS-friendly." },
      { title: "Cover letter", body: "Cover letter for a product designer applying to a Series A startup. Confident, specific, 3 paragraphs, signature." },
      { title: "Recommendation letter", body: "Letter of recommendation for a former direct report applying to graduate school. Warm, specific, 3 paragraphs." },
      { title: "Wedding invite", body: "Elegant wedding invitation: hosts, date, venue, RSVP card, dress code, registry link. Romantic typography." },
      { title: "Eulogy", body: "Two-page eulogy honoring a beloved grandfather: warmth, three vivid stories, a final blessing." },
    ],
  },
  marketing: {
    label: "Marketing",
    icon: Megaphone,
    accent: "var(--color-cyan)",
    prompts: [
      { title: "One-pager", body: "One-page product sheet for a B2B SaaS: hero pitch, three features, pricing, testimonial, contact." },
      { title: "Case study", body: "Two-page customer case study: challenge, solution, results with numbers, customer quote, screenshots." },
      { title: "Whitepaper cover", body: "Whitepaper cover and executive summary on the future of remote work. Sober, credible, footnoted." },
      { title: "Sales sheet", body: "Single-page sales sheet with feature grid, pricing tiers, social proof, and a clear call-to-action." },
      { title: "Brand brief", body: "Brand brief: mission, voice, audience, palette, typography choices, logo usage rules." },
    ],
  },
  creative: {
    label: "Creative",
    icon: Palette,
    accent: "var(--color-violet)",
    prompts: [
      { title: "Zine", body: "Four-page zine on the philosophy of paper in a screen age. Bold layout, varied typography, pull quotes." },
      { title: "Recipe card", body: "Two-page recipe card for handmade pasta: ingredients, technique, plating, photo placeholders, time stamps." },
      { title: "Travel guide", body: "Four-page weekend travel guide to Lisbon: map, day-by-day plan, three restaurants, two hidden gems." },
      { title: "Photo book spread", body: "Two-page photo book spread: cinematic image left, short personal essay right with deckled border." },
      { title: "Tournament bracket", body: "Single-page tournament bracket for 16 teams: clean lines, modern type, scores fillable inline." },
    ],
  },
} as const;

function PromptGallery({
  category,
  onCategory,
  onPick,
}: {
  category: keyof typeof PROMPT_GALLERY;
  onCategory: (c: keyof typeof PROMPT_GALLERY) => void;
  onPick: (prompt: string) => void;
}) {
  const cats = Object.entries(PROMPT_GALLERY) as Array<[keyof typeof PROMPT_GALLERY, typeof PROMPT_GALLERY[keyof typeof PROMPT_GALLERY]]>;
  const active = PROMPT_GALLERY[category];
  return (
    <div className="px-1 py-2">
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="size-8 rounded-lg grid place-items-center bg-gradient-to-br from-[var(--color-cyan)]/30 to-[var(--color-violet)]/30 ring-1 ring-[var(--color-cyan)]/40">
            <Sparkles size={16} className="text-[var(--color-cyan)]" />
          </span>
        </div>
        <h2 className="text-sm font-bold tracking-tight">What should we make?</h2>
        <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Pick a starter, or describe anything below.</p>
      </div>
      <div role="tablist" aria-label="Template categories" className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-thin -mx-1 px-1">
        {cats.map(([key, val]) => {
          const Icon = val.icon;
          const isActive = key === category;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategory(key)}
              className={`shrink-0 text-[11px] px-2.5 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors ${
                isActive
                  ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] border border-[var(--color-cyan)]/40"
                  : "border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-cyan)]/30"
              }`}
            >
              <Icon size={11} />
              {val.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-1.5">
        {active.prompts.map((p) => (
          <button
            key={p.title}
            onClick={() => onPick(p.body)}
            className="group text-left p-2.5 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-cyan)]/40 hover:bg-white/[0.025] transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-semibold text-[var(--color-fg)]">{p.title}</span>
              <ChevronRight size={11} className="text-[var(--color-muted)] group-hover:text-[var(--color-cyan)] transition-colors shrink-0" />
            </div>
            <p className="text-[11px] text-[var(--color-muted)] line-clamp-2 leading-relaxed">{p.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StagePill({ stage }: { stage: "idle" | "reading" | "planning" | "drafting" | "done" }) {
  const labels: Record<typeof stage, string> = {
    idle: "Idle",
    reading: "Reading your document",
    planning: "Planning the change",
    drafting: "Drafting…",
    done: "Done",
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-cyan)]/80">
      <span className="size-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
      {labels[stage]}
    </span>
  );
}

function StageTimeline({ stage }: { stage: "idle" | "reading" | "planning" | "drafting" | "done" }) {
  const stages: Array<{ key: "reading" | "planning" | "drafting"; label: string; icon: typeof FileText }> = [
    { key: "reading", label: "Reading document", icon: FileText },
    { key: "planning", label: "Planning change", icon: LayoutTemplate },
    { key: "drafting", label: "Drafting HTML", icon: Wand2 },
  ];
  const order = ["reading", "planning", "drafting"] as const;
  const activeIdx = order.indexOf(stage as (typeof order)[number]);
  return (
    <div className="text-xs text-[var(--color-muted)] space-y-1">
      {stages.map((s, i) => {
        const Icon = s.icon;
        const isDone = activeIdx > i;
        const isActive = activeIdx === i;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <span className={`size-4 rounded-full grid place-items-center transition-colors ${
              isDone ? "bg-green-500/20 text-green-400" : isActive ? "bg-[var(--color-cyan)]/20 text-[var(--color-cyan)] ring-1 ring-[var(--color-cyan)]/40" : "bg-white/5 text-[var(--color-muted)]"
            }`}>
              {isDone ? <Check size={9} /> : isActive ? <Loader2 size={9} className="animate-spin" /> : <Icon size={9} />}
            </span>
            <span className={isDone ? "text-[var(--color-fg)]/70 line-through opacity-60" : isActive ? "text-[var(--color-fg)]/90" : ""}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

