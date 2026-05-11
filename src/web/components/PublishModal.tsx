import { useEffect, useState } from "react";
import { Globe, Lock, Sparkles, Loader2, Check, X, Tag, ExternalLink, Copy } from "lucide-react";
import { useApi, ApiError } from "../lib/api";
import { captureEvent } from "../lib/analytics";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { Project } from "../lib/types";

const ALLOWED_TAGS = [
  "resume", "report", "invoice", "letter", "deck", "brief", "proposal", "contract",
  "memo", "essay", "guide", "manual", "flyer", "newsletter", "menu", "form",
  "agenda", "notes", "summary", "cv",
];

interface Props {
  project: Project;
  onClose: () => void;
  onPublished: (project: Project) => void;
}

export function PublishModal({ project, onClose, onPublished }: Props) {
  const api = useApi();
  const dialogRef = useFocusTrap<HTMLDivElement>();
  const [description, setDescription] = useState(project.description ?? "");
  const [tagInput, setTagInput] = useState(project.tags ?? "");
  const [working, setWorking] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    captureEvent("publish_modal_open", { projectId: project.id });
  }, [project.id]);

  const tagList = tagInput
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const publicUrl = project.slug ? `${window.location.origin}/c/${project.slug}` : "";

  async function runAiMeta() {
    if (aiBusy) return;
    setAiBusy(true);
    setError(null);
    captureEvent("publish_ai_meta_click", { projectId: project.id });
    const start = Date.now();
    try {
      const res = await api<{ description: string; tags: string[] }>(
        `/api/projects/${project.id}/ai-meta`,
        { method: "POST" }
      );
      setDescription(res.description);
      setTagInput(res.tags.join(", "));
      captureEvent("ai_generation_completed", {
        kind: "meta",
        latency_ms: Date.now() - start,
        tag_count: res.tags.length,
        description_len: res.description.length,
      });
    } catch (e) {
      const msg = e instanceof ApiError
        ? (typeof e.body === "object" && e.body && "error" in e.body
            ? String(e.body.error)
            : e.message)
        : e instanceof Error
          ? e.message
          : "Failed to generate";
      setError(msg);
      captureEvent("ai_generation_failed", { kind: "meta", error: msg });
    } finally {
      setAiBusy(false);
    }
  }

  async function togglePublish(nextPublic: boolean) {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const res = await api<{ project: Project }>(`/api/projects/${project.id}/publish`, {
        method: "POST",
        body: JSON.stringify({
          isPublic: nextPublic,
          description: description.trim() || undefined,
          tags: tagList.join(",") || undefined,
        }),
      });
      onPublished(res.project);
      captureEvent(nextPublic ? "project_published" : "project_unpublished", {
        projectId: project.id,
        has_description: Boolean(description.trim()),
        tag_count: tagList.length,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setWorking(false);
    }
  }

  async function copyUrl() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    captureEvent("publish_copy_url", { projectId: project.id });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-title"
        className="card w-full max-w-lg p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 id="publish-title" className="text-lg font-semibold flex items-center gap-2">
              <Globe size={18} className="text-[var(--color-cyan)]" />
              Publish to community
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Share your PDF on the Explore feed. Anyone can view it; signed-in users can remix.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-fg)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {project.isPublic && publicUrl && (
          <div className="mb-3 p-2.5 rounded-lg bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30 flex items-center gap-2">
            <Check size={14} className="text-[var(--color-cyan)] shrink-0" />
            <input
              readOnly
              value={publicUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 bg-transparent text-xs"
              aria-label="Public URL"
            />
            <button
              onClick={copyUrl}
              className="btn btn-ghost text-xs px-2 py-1"
              style={{ minHeight: 28 }}
              aria-label="Copy URL"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost text-xs px-2 py-1"
              style={{ minHeight: 28 }}
              aria-label="Open public URL"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="publish-description" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Description
              </label>
              <button
                onClick={runAiMeta}
                disabled={aiBusy}
                className="text-xs inline-flex items-center gap-1 text-[var(--color-cyan)] hover:text-[var(--color-cyan)]/80 disabled:opacity-50"
                aria-label="Generate description and tags with AI"
              >
                {aiBusy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {aiBusy ? "Thinking…" : "Generate with AI"}
              </button>
            </div>
            <textarea
              id="publish-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 280))}
              placeholder="One short sentence — what is this PDF for?"
              className="input w-full text-sm resize-none py-2"
              rows={2}
              maxLength={280}
            />
            <p className="text-[10px] text-[var(--color-muted)] mt-1 text-right">
              {description.length}/280
            </p>
          </div>

          <div>
            <label htmlFor="publish-tags" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
              Tags (comma-separated, max 5)
            </label>
            <input
              id="publish-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="resume, deck, brief"
              className="input w-full text-sm py-2"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {ALLOWED_TAGS.map((t) => {
                const active = tagList.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setTagInput(tagList.filter((x) => x !== t).join(", "));
                      } else if (tagList.length < 5) {
                        setTagInput([...tagList, t].join(", "));
                      }
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      active
                        ? "bg-[var(--color-cyan)] text-black border-[var(--color-cyan)]"
                        : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/40"
                    }`}
                  >
                    <Tag size={9} className="inline mr-0.5" />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-line)]">
          {project.isPublic ? (
            <button
              onClick={() => togglePublish(false)}
              disabled={working}
              className="btn btn-ghost text-xs text-red-300 hover:text-red-200"
              style={{ minHeight: 36 }}
            >
              <Lock size={13} /> Unpublish
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn btn-ghost text-xs"
              style={{ minHeight: 36 }}
            >
              Cancel
            </button>
            <button
              onClick={() => togglePublish(true)}
              disabled={working}
              className="btn btn-primary text-xs"
              style={{ minHeight: 36 }}
            >
              {working ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
              {project.isPublic ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
