import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Code,
  Copy,
  Download,
  Eye,
  Loader2,
  Pencil,
  Share2,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import { useApi, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { captureEvent } from "../lib/analytics";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { PublicProjectSummary } from "../lib/types";

interface PublicProjectDetail extends PublicProjectSummary {
  html: string;
  css: string;
  margin: string;
}

const fmtDate = (v: number | string) => {
  const ts = typeof v === "string" ? Date.parse(v) : v;
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function Community() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const { status } = useAuth();
  const [project, setProject] = useState<PublicProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remixing, setRemixing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  useDocumentTitle(project?.title ? `${project.title} — Community PDF` : "Community PDF");

  const canonicalUrl = useMemo(
    () => (slug ? `${window.location.origin}/c/${slug}` : ""),
    [slug]
  );

  // Inject per-page meta (description, canonical, og/twitter, JSON-LD) without an SSR step.
  useEffect(() => {
    if (!project || !slug) return;
    const head = document.head;
    const previous: HTMLElement[] = [];

    const upsertMeta = (selector: string, attrs: Record<string, string>) => {
      let el = head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        head.appendChild(el);
      }
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      previous.push(el);
    };
    const upsertLink = (rel: string, href: string) => {
      let el = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        head.appendChild(el);
      }
      el.setAttribute("href", href);
      previous.push(el);
    };

    const desc =
      (project.description ?? `Community PDF: ${project.title}. Remix it in the editor.`).slice(0, 156);
    const ogImage = `${window.location.origin}/s/og/${slug}.png`;
    upsertMeta('meta[name="description"]', { name: "description", content: desc });
    upsertLink("canonical", canonicalUrl);
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "article" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: project.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: desc });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: project.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CreativeWork",
          "@id": canonicalUrl,
          name: project.title,
          description: desc,
          url: canonicalUrl,
          encodingFormat: "application/pdf",
          inLanguage: "en",
          dateModified: new Date(project.updatedAt).toISOString(),
          dateCreated: new Date(project.createdAt).toISOString(),
          keywords: project.tags.join(", "),
          interactionStatistic: [
            {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/ViewAction",
              userInteractionCount: project.viewCount,
            },
            {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/EditAction",
              userInteractionCount: project.editCount,
            },
          ],
          ...(project.author?.name && {
            author: { "@type": "Person", name: project.author.name },
          }),
          publisher: { "@type": "Organization", name: "Megabyte PDF", url: window.location.origin },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin + "/" },
            { "@type": "ListItem", position: 2, name: "Explore", item: window.location.origin + "/explore" },
            { "@type": "ListItem", position: 3, name: project.title, item: canonicalUrl },
          ],
        },
      ],
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.communityJsonld = "1";
    script.textContent = JSON.stringify(jsonLd);
    head.appendChild(script);

    return () => {
      script.remove();
      // Leave meta tags in place — next route will overwrite them; this avoids flashing empty meta.
      void previous;
    };
  }, [project, slug, canonicalUrl]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<{ project: PublicProjectDetail }>(`/api/explore/${slug}`)
      .then((res) => {
        if (cancelled) return;
        setProject(res.project);
        captureEvent("community_view", { slug, title: res.project.title });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, api]);

  const remix = async () => {
    if (!slug) return;
    if (status !== "authenticated") {
      const next = encodeURIComponent(`/c/${slug}`);
      navigate(`/sign-in?next=${next}`);
      return;
    }
    setRemixing(true);
    setError(null);
    try {
      const { project: created } = await api<{ project: { id: string } }>(
        `/api/explore/${slug}/remix`,
        { method: "POST" }
      );
      captureEvent("community_remix", { slug });
      navigate(`/p/${created.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setError("You're at your PDF limit. Upgrade for more.");
      } else if (e instanceof ApiError && e.status === 429) {
        setError("Slow down — try again in a moment.");
      } else {
        setError(e instanceof Error ? e.message : "Remix failed");
      }
    } finally {
      setRemixing(false);
    }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: project?.title ?? "PDF", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
      captureEvent("community_share", { slug });
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main id="main-content" className="flex-1">
        {loading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-[var(--color-cyan)]" />
          </div>
        )}

        {!loading && (error || !project) && (
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold mb-3">PDF not found</h1>
            <p className="text-[var(--color-muted)] mb-6">
              {error ?? "This PDF may have been unpublished or removed."}
            </p>
            <Link to="/explore" className="btn btn-primary text-sm">
              <ArrowLeft size={14} /> Back to Explore
            </Link>
          </div>
        )}

        {!loading && project && (
          <>
            <section className="border-b border-[var(--color-line)] bg-gradient-to-b from-[var(--color-cyan)]/[0.04] to-transparent">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-cyan)] mb-4"
                >
                  <ArrowLeft size={12} />
                  All community PDFs
                </Link>
                <div className="flex items-start gap-6 flex-col sm:flex-row">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 break-words">
                      {project.title}
                    </h1>
                    {project.description && (
                      <p className="text-[var(--color-muted)] text-base sm:text-lg mb-4 max-w-2xl">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                      {project.author?.name && (
                        <span className="inline-flex items-center gap-1.5">
                          <User size={12} />
                          <span className="text-[var(--color-fg)]">{project.author.name}</span>
                        </span>
                      )}
                      <span className="opacity-40">·</span>
                      <span>Updated {fmtDate(project.updatedAt)}</span>
                      <span className="opacity-40">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Eye size={11} />
                        {project.viewCount.toLocaleString()} views
                      </span>
                      <span className="opacity-40">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Pencil size={11} />
                        {project.editCount.toLocaleString()} edits
                      </span>
                      <span className="opacity-40">·</span>
                      <span className="uppercase tracking-wider">{project.pageSize}</span>
                    </div>
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.tags.map((t) => (
                          <Link
                            key={t}
                            to={`/t/${encodeURIComponent(t)}`}
                            className="text-xs px-2 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/60 hover:text-[var(--color-fg)] inline-flex items-center gap-1"
                          >
                            <Tag size={10} />
                            {t}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={remix}
                      disabled={remixing}
                      className="btn btn-primary text-sm justify-center"
                      style={{ minHeight: 40 }}
                      aria-label="Remix this PDF into your workspace"
                    >
                      {remixing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      <span>{remixing ? "Remixing…" : "Remix this PDF"}</span>
                    </button>
                    <button
                      onClick={shareLink}
                      className="btn btn-ghost text-sm justify-center"
                      style={{ minHeight: 40 }}
                      aria-label="Share link to this PDF"
                    >
                      {copied ? (
                        <>
                          <Copy size={14} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowEmbed(true);
                        captureEvent("community_embed_open", { slug });
                      }}
                      className="btn btn-ghost text-sm justify-center"
                      style={{ minHeight: 40 }}
                      aria-label="Get embed code"
                    >
                      <Code size={14} />
                      <span>Embed</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (downloading || !slug) return;
                        setDownloading(true);
                        captureEvent("community_download_click", { slug });
                        try {
                          const res = await fetch(`/api/public/${slug}/pdf`);
                          if (!res.ok) {
                            setError(res.status === 429 ? "Daily download limit reached. Try again tomorrow." : "Download failed.");
                            return;
                          }
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${project.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60) || "document"}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                          captureEvent("community_download_success", { slug });
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Download failed");
                        } finally {
                          setDownloading(false);
                        }
                      }}
                      disabled={downloading}
                      className="btn btn-ghost text-sm justify-center"
                      style={{ minHeight: 40 }}
                      aria-label="Download as PDF"
                    >
                      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>{downloading ? "Generating…" : "Download PDF"}</span>
                    </button>
                  </div>
                </div>
                {error && (
                  <div
                    role="alert"
                    className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-3"
                  >
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
              <div
                className="rounded-lg border border-[var(--color-line)] bg-white overflow-hidden shadow-2xl"
                style={{ aspectRatio: project.pageSize === "Legal" ? "8.5 / 14" : project.pageSize === "A4" ? "210 / 297" : "8.5 / 11" }}
              >
                <iframe
                  src={`/api/public/${slug}/render`}
                  title={`Preview of ${project.title}`}
                  className="w-full h-full"
                  sandbox="allow-same-origin"
                  loading="lazy"
                />
              </div>
              {slug && <ReactionBar slug={slug} />}
              <p className="text-center text-xs text-[var(--color-muted)] mt-3">
                Hit <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px]">Remix</kbd>{" "}
                to open this in the editor and make it yours.
              </p>
            </section>
          </>
        )}
      </main>
      <Footer />
      {showEmbed && project && slug && (
        <EmbedModal
          slug={slug}
          title={project.title}
          pageSize={project.pageSize}
          onClose={() => setShowEmbed(false)}
        />
      )}
    </div>
  );
}

const REACTIONS: Array<{ kind: "fire" | "heart" | "target" | "sparkle"; emoji: string; label: string }> = [
  { kind: "fire", emoji: "🔥", label: "Fire" },
  { kind: "heart", emoji: "❤️", label: "Love it" },
  { kind: "target", emoji: "🎯", label: "On point" },
  { kind: "sparkle", emoji: "✨", label: "Beautiful" },
];

function ReactionBar({ slug }: { slug: string }) {
  const api = useApi();
  const storageKey = `megabyte-pdf:reactions:${slug}`;
  const [counts, setCounts] = useState<Record<string, number>>({ fire: 0, heart: 0, target: 0, sparkle: 0 });
  const [mine, setMine] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const [popping, setPopping] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ counts: Record<string, number> }>(`/api/explore/${slug}/reactions`)
      .then((r) => {
        if (!cancelled) setCounts(r.counts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, api]);

  async function react(kind: "fire" | "heart" | "target" | "sparkle") {
    if (mine[kind]) return;
    setCounts((c) => ({ ...c, [kind]: (c[kind] ?? 0) + 1 }));
    const nextMine = { ...mine, [kind]: true };
    setMine(nextMine);
    window.localStorage.setItem(storageKey, JSON.stringify(nextMine));
    setPopping(kind);
    setTimeout(() => setPopping((p) => (p === kind ? null : p)), 320);
    captureEvent("community_react", { slug, kind });
    try {
      await api(`/api/explore/${slug}/react`, {
        method: "POST",
        body: JSON.stringify({ kind }),
      });
    } catch {
      // optimistic, swallow
    }
  }

  return (
    <div className="mt-5 flex items-center justify-center flex-wrap gap-2">
      {REACTIONS.map((r) => {
        const active = !!mine[r.kind];
        return (
          <button
            key={r.kind}
            type="button"
            onClick={() => react(r.kind)}
            disabled={active}
            aria-label={`React: ${r.label}`}
            aria-pressed={active}
            className={`group inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${
              active
                ? "border-[var(--color-cyan)]/60 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] cursor-default"
                : "border-[var(--color-line)] bg-[var(--color-bg-card)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/40 hover:text-[var(--color-fg)] cursor-pointer"
            }`}
          >
            <span
              aria-hidden="true"
              className={`text-base inline-block ${popping === r.kind ? "reaction-pop" : ""}`}
            >
              {r.emoji}
            </span>
            <span className="tabular-nums text-xs font-medium">{counts[r.kind] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function EmbedModal({
  slug,
  title,
  pageSize,
  onClose,
}: {
  slug: string;
  title: string;
  pageSize: string;
  onClose: () => void;
}) {
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("700");
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://pdf.megabyte.space";
  const embedSrc = `${origin}/api/public/${slug}/render`;
  const pageHref = `${origin}/c/${slug}`;
  const safeTitle = title.replace(/"/g, "&quot;");
  const code = `<iframe src="${embedSrc}" title="${safeTitle}" width="${width}" height="${height}" style="border:1px solid #e5e7eb;border-radius:8px;max-width:100%;" loading="lazy"></iframe>\n<p style="font:12px system-ui,sans-serif;color:#64748b;margin-top:6px"><a href="${pageHref}" rel="noopener">${safeTitle}</a> — made with <a href="https://pdf.megabyte.space" rel="noopener">Megabyte PDF</a></p>`;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    captureEvent("community_embed_copy", { slug });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="embed-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="embed-modal-title" className="font-semibold text-lg">Embed this PDF</h2>
          <button
            autoFocus
            onClick={onClose}
            className="size-8 rounded-md hover:bg-white/5 grid place-items-center"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-[var(--color-muted)] mb-4">
          Paste this snippet into any HTML page or Notion/Ghost/WordPress embed block.
          Page size is {pageSize}.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="text-xs text-[var(--color-muted)]">
            Width
            <input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="input text-sm mt-1"
              placeholder="100% or 640"
              aria-label="Embed width"
            />
          </label>
          <label className="text-xs text-[var(--color-muted)]">
            Height (px)
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="input text-sm mt-1"
              inputMode="numeric"
              aria-label="Embed height"
            />
          </label>
        </div>
        <pre className="text-[11px] bg-black/40 border border-white/10 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-48">
          <code>{code}</code>
        </pre>
        <button
          onClick={copy}
          className="btn btn-primary w-full mt-4 text-sm"
          style={{ minHeight: 40 }}
        >
          {copied ? (
            <>
              <Copy size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Code size={14} />
              <span>Copy embed code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
