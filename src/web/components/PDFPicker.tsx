import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  FileText,
  Plus,
  Search,
  Loader2,
  Sparkles,
  Globe,
  Lock,
  Pencil,
  X,
} from "lucide-react";
import { useApi, ApiError } from "../lib/api";
import type { ProjectListItem } from "../lib/types";

interface Props {
  currentId: string;
  currentTitle: string;
  isPublic?: boolean;
  onRename: (next: string) => Promise<void> | void;
  onAiRename?: () => Promise<void> | void;
}

const fmtDate = (v: number | string | undefined) => {
  if (!v) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(v);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export function PDFPicker({ currentId, currentTitle, isPublic, onRename, onAiRename }: Props) {
  const api = useApi();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [aiRenaming, setAiRenaming] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.tags ?? "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ projects: ProjectListItem[] }>("/api/projects");
      setProjects(res.projects);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!open) return;
    void fetchProjects();
    setTimeout(() => searchRef.current?.focus(), 30);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
          if (e.key === "ArrowUp" && (active as HTMLInputElement).selectionStart !== 0) return;
        }
        e.preventDefault();
        const items = Array.from(
          containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []
        );
        if (items.length === 0) return;
        const focused = items.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          e.key === "ArrowDown"
            ? focused < 0
              ? 0
              : (focused + 1) % items.length
            : focused <= 0
              ? items.length - 1
              : focused - 1;
        items[next]?.focus();
      }
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open, fetchProjects]);

  const createPdf = async () => {
    setCreating(true);
    setError(null);
    try {
      const { project } = await api<{ project: { id: string } }>("/api/projects", {
        method: "POST",
      });
      setOpen(false);
      navigate(`/p/${project.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setError("Upgrade for more PDFs.");
      } else {
        setError("Couldn't create — try again.");
      }
    } finally {
      setCreating(false);
    }
  };

  const beginRename = () => {
    setRenaming(currentTitle);
    setTimeout(() => {
      renameRef.current?.focus();
      renameRef.current?.select();
    }, 0);
  };

  const commitRename = async () => {
    if (renaming === null) return;
    const next = renaming.trim();
    setRenaming(null);
    if (next && next !== currentTitle) await onRename(next);
  };

  const triggerAiRename = async () => {
    if (!onAiRename) return;
    setAiRenaming(true);
    try {
      await onAiRename();
    } finally {
      setAiRenaming(false);
    }
  };

  return (
    <div className="relative flex-1 min-w-0 max-w-md" ref={containerRef}>
      {renaming !== null ? (
        <input
          ref={renameRef}
          autoFocus
          aria-label="Rename PDF"
          value={renaming}
          onChange={(e) => setRenaming(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setRenaming(null);
          }}
          maxLength={80}
          className="input w-full font-medium text-sm py-1.5"
        />
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="group w-full flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] hover:border-[var(--color-cyan)]/60 hover:bg-white/[0.04] transition-all"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Current PDF: ${currentTitle}. Switch PDF`}
          style={{ minHeight: 36 }}
        >
          <FileText size={14} className="shrink-0 text-[var(--color-cyan)]" />
          <span className="font-medium text-sm truncate flex-1 text-left">{currentTitle}</span>
          {isPublic && (
            <Globe size={12} className="shrink-0 text-emerald-400/80" aria-label="Public" />
          )}
          <ChevronDown
            size={14}
            className={`shrink-0 text-[var(--color-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {open && (
        <div
          role="listbox"
          aria-label="Your PDFs"
          className="absolute left-0 top-full mt-2 w-[min(420px,calc(100vw-2rem))] card p-0 z-50 shadow-2xl border border-[var(--color-line)] overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,20,28,0.98) 0%, rgba(10,10,15,0.98) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="p-3 border-b border-[var(--color-line)] flex items-center gap-2 bg-black/20">
            <Search size={14} className="text-[var(--color-muted)] shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your PDFs…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
              aria-label="Search PDFs"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="px-3 py-2 border-b border-[var(--color-line)] flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
            <span className="text-[var(--color-cyan)]">Current</span>
            <span className="opacity-40">·</span>
            <span className="truncate text-[var(--color-fg)] normal-case tracking-normal font-medium text-xs">
              {currentTitle}
            </span>
            <div className="flex-1" />
            {onAiRename && (
              <button
                onClick={triggerAiRename}
                disabled={aiRenaming}
                className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 text-[var(--color-cyan)] disabled:opacity-50"
                aria-label="AI rename"
                title="Auto-name with AI"
              >
                {aiRenaming ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                <span>AI</span>
              </button>
            )}
            <button
              onClick={() => {
                setOpen(false);
                beginRename();
              }}
              className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-fg)]"
              aria-label="Rename"
              title="Rename"
            >
              <Pencil size={11} />
              <span>Rename</span>
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-[var(--color-cyan)]" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-xs text-[var(--color-muted)] text-center py-8 px-4">
                {query ? "No matches." : "No other PDFs yet."}
              </div>
            )}
            {!loading &&
              filtered.map((p) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={p.id === currentId}
                  onClick={() => {
                    setOpen(false);
                    if (p.id !== currentId) navigate(`/p/${p.id}`);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors border-l-2 ${
                    p.id === currentId
                      ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/[0.06]"
                      : "border-transparent hover:bg-white/[0.04] hover:border-white/10"
                  }`}
                >
                  <FileText
                    size={14}
                    className={`shrink-0 mt-0.5 ${
                      p.id === currentId ? "text-[var(--color-cyan)]" : "text-[var(--color-muted)]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`truncate text-sm font-medium ${
                          p.id === currentId
                            ? "text-[var(--color-cyan)]"
                            : "text-[var(--color-fg)]"
                        }`}
                      >
                        {p.title}
                      </span>
                      {p.isPublic ? (
                        <Globe size={10} className="shrink-0 text-emerald-400/80" />
                      ) : (
                        <Lock size={10} className="shrink-0 text-[var(--color-muted)]/60" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)] mt-0.5">
                      <span>{fmtDate(p.updatedAt)}</span>
                      {(p.editCount ?? 0) > 0 && (
                        <>
                          <span className="opacity-40">·</span>
                          <span>{p.editCount} edits</span>
                        </>
                      )}
                      {(p.viewCount ?? 0) > 0 && (
                        <>
                          <span className="opacity-40">·</span>
                          <span>{p.viewCount} views</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>

          <div className="border-t border-[var(--color-line)] bg-black/30 p-2 flex items-center gap-2">
            <button
              onClick={createPdf}
              disabled={creating}
              className="flex-1 btn btn-primary text-xs py-2 justify-center"
              style={{ minHeight: 36 }}
            >
              {creating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              <span>New PDF</span>
            </button>
            <button
              onClick={() => {
                setOpen(false);
                navigate("/dashboard");
              }}
              className="btn btn-ghost text-xs py-2 px-3"
              style={{ minHeight: 36 }}
            >
              All
            </button>
          </div>
          {error && (
            <div role="alert" className="px-3 py-1.5 text-[11px] text-red-300 bg-red-500/10">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
