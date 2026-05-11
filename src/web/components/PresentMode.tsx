import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";
import { buildPreviewDoc } from "../lib/preview";
import { captureEvent } from "../lib/analytics";
import type { Project } from "../lib/types";

interface Props {
  project: Pick<Project, "id" | "title" | "html" | "css" | "pageSize" | "margin">;
  onClose: () => void;
}

export function PresentMode({ project, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const srcDoc = useMemo(
    () => buildPreviewDoc(project.html, project.css, project.pageSize, project.margin),
    [project.html, project.css, project.pageSize, project.margin]
  );

  useEffect(() => {
    captureEvent("present_open", { projectId: project.id, pageSize: project.pageSize });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      captureEvent("present_close", { projectId: project.id });
    };
  }, [project.id, project.pageSize]);

  // Listen for pagination signal from preview iframe
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "preview:rendered" && typeof e.data.pages === "number") {
        setPageCount(Math.max(1, e.data.pages));
        setReady(true);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Apply slide layout inside iframe once it's ready
  const applySlideLayout = useCallback((pageIdx: number) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const pages = doc.querySelectorAll<HTMLElement>(".page");
    if (pages.length === 0) return;

    // Set body to fit one page at a time, centered
    doc.body.style.padding = "0";
    doc.body.style.gap = "0";
    doc.body.style.minHeight = "100vh";
    doc.body.style.justifyContent = "center";
    doc.body.style.alignItems = "center";
    doc.body.style.background = "#0a0a0f";
    doc.documentElement.style.background = "#0a0a0f";

    pages.forEach((p, i) => {
      p.style.display = i === pageIdx ? "block" : "none";
      p.style.cursor = "default";
      p.style.boxShadow = "0 24px 64px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)";
      // Disable inline editing in present mode
      p.removeAttribute("contenteditable");
    });
  }, []);

  // Re-apply layout whenever ready or page changes
  useEffect(() => {
    if (!ready) return;
    applySlideLayout(currentPage);
  }, [ready, currentPage, applySlideLayout]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);
  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(pageCount - 1, p + 1));
  }, [pageCount]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setCurrentPage(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setCurrentPage(pageCount - 1);
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose, pageCount]);

  const toggleFullscreen = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Presenting ${project.title}`}
      className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 px-4 py-2 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="text-xs text-white/70 truncate max-w-md pointer-events-auto">
          {project.title}
        </div>
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={`${isFullscreen ? "Exit" : "Enter"} fullscreen (F)`}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Exit present mode"
            title="Exit (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title={`${project.title} — presentation`}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full bg-[#0a0a0f] block border-0"
        />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-white/40 text-sm">Loading…</div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent z-10">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
          title="Previous (←)"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-1.5 max-w-xs overflow-x-auto scrollbar-thin">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === currentPage ? "page" : undefined}
              className={`shrink-0 h-2 rounded-full transition-all ${
                i === currentPage
                  ? "w-8 bg-[var(--color-cyan)]"
                  : "w-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-white/60 font-mono tabular-nums min-w-[3rem] text-center">
          {currentPage + 1} / {pageCount}
        </span>
        <button
          onClick={goNext}
          disabled={currentPage >= pageCount - 1}
          className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
          title="Next (→)"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
