import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Trash2, ArrowRight, Sparkles, Crown, AlertCircle, Check, Copy } from "lucide-react";
import { useApi, ApiError } from "../lib/api";
import { useConfig } from "../lib/config";
import { captureEvent, identifyUser } from "../lib/analytics";
import type { Me, ProjectListItem, Project } from "../lib/types";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Dashboard() {
  useDocumentTitle("Your dashboard — Your saved PDF projects");
  const api = useApi();
  const config = useConfig();
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [importToast, setImportToast] = useState(false);
  const [guestPending, setGuestPending] = useState<{ title?: string; html: string; css: string; pageSize?: string; margin?: string } | null>(null);
  const [importingGuest, setImportingGuest] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setSuccessToast(true);
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => setSuccessToast(false), 6000);
    }
    const initialPrompt = params.get("prompt");
    if (initialPrompt) {
      sessionStorage.setItem("megabyte-pdf:initial-prompt", initialPrompt.slice(0, 4000));
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  useEffect(() => {
    const pending = sessionStorage.getItem("megabyte-pdf:initial-prompt");
    if (!pending || !me || creating) return;
    sessionStorage.removeItem("megabyte-pdf:initial-prompt");
    captureEvent("dashboard_initial_prompt", { length: pending.length });
    (async () => {
      setCreating(true);
      try {
        const { project } = await api<{ project: Project }>("/api/projects", { method: "POST" });
        sessionStorage.setItem(`megabyte-pdf:prefill:${project.id}`, pending);
        navigate(`/p/${project.id}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 402) setLimitHit(true);
        else setError(e instanceof Error ? e.message : "Failed to create");
      } finally {
        setCreating(false);
      }
    })();
  }, [api, navigate, me, creating]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, projRes] = await Promise.all([
          api<{ user: Me["user"] | null; usage: Me["usage"] | null }>("/api/me"),
          api<{ projects: ProjectListItem[] }>("/api/projects"),
        ]);
        if (cancelled) return;
        if (!meRes.user || !meRes.usage) {
          navigate("/sign-in");
          return;
        }
        const me: Me = { user: meRes.user, usage: meRes.usage };
        setMe(me);
        identifyUser(me.user.id, { plan: me.user.plan });

        // Import guest document after sign-up / sign-in
        const importRaw = sessionStorage.getItem("megabyte-pdf:import-guest");
        if (importRaw) {
          try {
            const guest = JSON.parse(importRaw) as { title?: string; html?: string; css?: string; pageSize?: string; margin?: string };
            if (guest.html && guest.css) {
              if (projRes.projects.length === 0) {
                // New user — auto-import immediately
                sessionStorage.removeItem("megabyte-pdf:import-guest");
                const res = await api<{ project: import("../lib/types").Project }>("/api/projects", {
                  method: "POST",
                });
                await api(`/api/projects/${res.project.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ title: guest.title || "Untitled PDF", html: guest.html, css: guest.css, pageSize: guest.pageSize, margin: guest.margin }),
                });
                if (!cancelled) {
                  captureEvent("guest_import_success");
                  setImportToast(true);
                  setTimeout(() => setImportToast(false), 6000);
                  navigate(`/p/${res.project.id}`);
                  return;
                }
              } else {
                // Existing user — offer a banner prompt instead of auto-importing
                sessionStorage.removeItem("megabyte-pdf:import-guest");
                if (!cancelled) setGuestPending(guest as { html: string; css: string; title?: string; pageSize?: string; margin?: string });
              }
            } else {
              sessionStorage.removeItem("megabyte-pdf:import-guest");
            }
          } catch {
            sessionStorage.removeItem("megabyte-pdf:import-guest");
          }
        }

        if (!cancelled) setProjects(projRes.projects);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, navigate]);

  async function createProject() {
    setCreating(true);
    setError(null);
    try {
      const { project } = await api<{ project: Project }>("/api/projects", { method: "POST" });
      captureEvent("dashboard_project_create");
      navigate(`/p/${project.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setLimitHit(true);
      } else {
        setError(e instanceof Error ? e.message : "Failed to create");
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this PDF? This can't be undone.")) return;
    captureEvent("dashboard_project_delete");
    try {
      await api(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function duplicateProject(id: string) {
    setCreating(true);
    captureEvent("dashboard_project_duplicate");
    try {
      const { project: newProject } = await api<{ project: Project }>(`/api/projects/${id}/duplicate`, { method: "POST" });
      navigate(`/p/${newProject.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setLimitHit(true);
      } else {
        setError(e instanceof Error ? e.message : "Failed to duplicate");
      }
    } finally {
      setCreating(false);
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

  async function manageBilling() {
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", { method: "POST" });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Billing unavailable");
    }
  }

  async function importGuestDoc() {
    if (!guestPending || importingGuest) return;
    setImportingGuest(true);
    try {
      const res = await api<{ project: Project }>("/api/projects", { method: "POST" });
      await api(`/api/projects/${res.project.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: guestPending.title || "Imported Guest Doc", html: guestPending.html, css: guestPending.css, pageSize: guestPending.pageSize, margin: guestPending.margin }),
      });
      captureEvent("guest_import_existing_user");
      setGuestPending(null);
      navigate(`/p/${res.project.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setLimitHit(true);
        setGuestPending(null);
      } else {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    } finally {
      setImportingGuest(false);
    }
  }

  const empty = !loading && projects.length === 0;
  const overLimit = me && me.usage.projectCount >= me.usage.projectLimit;
  const isPro = me?.user.plan === "pro";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your PDFs
            </h1>
            {me && (
              <p className="text-sm text-[var(--color-muted)] mt-2">
                {me.usage.projectCount} of {me.usage.projectLimit} used ·{" "}
                <span className="inline-flex items-center gap-1">
                  {isPro ? (
                    <>
                      <Crown size={14} className="text-[var(--color-cyan)]" /> Pro
                    </>
                  ) : (
                    <>Free</>
                  )}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config?.billingEnabled && !isPro && (
              <button onClick={() => { captureEvent("dashboard_upgrade_click"); upgrade(); }} className="btn btn-ghost text-sm">
                <Crown size={16} /> Upgrade
              </button>
            )}
            {config?.billingEnabled && isPro && (
              <button onClick={manageBilling} className="btn btn-ghost text-sm">
                Billing
              </button>
            )}
            <button
              onClick={createProject}
              disabled={creating}
              className="btn btn-primary text-sm"
            >
              <Plus size={16} /> New PDF
            </button>
          </div>
        </div>

        {successToast && (
          <div role="status" aria-live="polite" className="mb-6 flex items-center gap-3 p-4 rounded-lg border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/10 text-sm">
            <Check size={18} className="text-[var(--color-cyan)] shrink-0" />
            <div>
              <strong className="text-[var(--color-cyan)]">Welcome to Pro!</strong> PDF export, share links, and Opus are now unlocked.
            </div>
          </div>
        )}
        {importToast && (
          <div role="status" aria-live="polite" className="mb-6 flex items-center gap-3 p-4 rounded-lg border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/10 text-sm">
            <Check size={18} className="text-[var(--color-cyan)] shrink-0" />
            <div>
              <strong className="text-[var(--color-cyan)]">Guest document imported!</strong> Your work has been saved to your account.
            </div>
          </div>
        )}
        {guestPending && (
          <div role="status" aria-live="polite" className="mb-6 card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <strong>You have an unsaved guest document.</strong> Import it as a new PDF?
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGuestPending(null)}
                className="btn btn-ghost text-sm"
              >
                Dismiss
              </button>
              <button
                onClick={importGuestDoc}
                disabled={importingGuest}
                className="btn btn-primary text-sm"
              >
                <Plus size={16} /> Import
              </button>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {limitHit && (
          <div role="alert" aria-live="assertive" className="mb-6 card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <strong>You've hit your free plan limit.</strong> Pro gives you 10 projects, PDF export, and share links.
            </div>
            <button onClick={() => { captureEvent("dashboard_limit_hit_upgrade"); upgrade(); }} className="btn btn-primary text-sm">
              <Crown size={16} /> Upgrade — $9/mo
            </button>
          </div>
        )}

        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading projects">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card p-5 h-32 animate-pulse opacity-50" aria-hidden="true" />
            ))}
          </div>
        )}

        {empty && (
          <div className="text-center py-20 animate-fade-in-up">
            <div
              className="mx-auto mb-6 size-20 rounded-2xl grid place-items-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,237,0.15))",
                border: "1px solid var(--color-line)",
              }}
            >
              <Sparkles size={36} className="text-[var(--color-cyan)]" />
            </div>
            <h2
              className="text-2xl lg:text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              No PDFs yet
            </h2>
            <p className="text-[var(--color-muted)] mb-8 max-w-md mx-auto">
              Prompt the AI. Watch it draw your document page by page. Download a real PDF.
            </p>
            <button
              onClick={createProject}
              disabled={creating}
              className="btn btn-primary text-base px-8 py-4"
              style={{ minHeight: 56 }}
            >
              <Plus size={20} /> Add New PDF
            </button>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={() => deleteProject(p.id)} onDuplicate={() => duplicateProject(p.id)} />
            ))}
            {!overLimit && (
              <button
                onClick={createProject}
                disabled={creating}
                className="card p-5 grid place-items-center min-h-[148px] border-dashed hover:border-[var(--color-cyan)]/50 hover:bg-white/[0.02] transition-all"
              >
                <div className="text-center">
                  <Plus size={28} className="mx-auto mb-2 text-[var(--color-cyan)]" />
                  <span className="text-sm font-medium">New PDF</span>
                </div>
              </button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
  onDuplicate,
}: {
  project: ProjectListItem;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="card p-5 group flex flex-col gap-4 hover:border-[var(--color-cyan)]/30 hover:-translate-y-0.5 transition-all">
      <Link to={`/p/${project.id}`} className="flex-1 min-w-0 flex items-start gap-3">
        <div className="size-10 rounded-lg bg-[var(--color-cyan)]/10 grid place-items-center text-[var(--color-cyan)] shrink-0">
          <FileText size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate mb-0.5">{project.title}</h3>
          <p className="text-xs text-[var(--color-muted)]">
            {project.turns} turn{project.turns === 1 ? "" : "s"} · {project.pageSize} ·{" "}
            {timeAgo(project.updatedAt)}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-xs text-[var(--color-muted)] hover:text-red-400 inline-flex items-center gap-1 transition-colors"
            aria-label="Delete project"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-cyan)] inline-flex items-center gap-1 transition-colors"
            aria-label="Duplicate project"
          >
            <Copy size={14} /> Duplicate
          </button>
        </div>
        <Link
          to={`/p/${project.id}`}
          className="text-xs font-medium text-[var(--color-cyan)] inline-flex items-center gap-1 underline-hover"
        >
          Open <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function timeAgo(ts: number | string): string {
  const ms = typeof ts === "string" ? new Date(ts).getTime() : ts;
  if (!ms || !isFinite(ms)) return "—";
  const sec = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}
