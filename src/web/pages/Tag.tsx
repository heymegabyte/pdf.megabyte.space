import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Tag as TagIcon, Eye, Pencil, ArrowRight, Loader2, ArrowLeft, Rss } from "lucide-react";
import { useApi } from "../lib/api";
import { captureEvent } from "../lib/analytics";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import type { PublicProjectSummary } from "../lib/types";

const ALLOWED_TAG_RE = /^[a-z0-9-]{1,40}$/;

const TAG_INTROS: Record<string, string> = {
  resume: "Sharp, scannable, hire-magnet resumes. Remix one in 30 seconds.",
  cv: "Academic and clinical CVs with publications, awards, and grants laid out clean.",
  report: "Quarterly reports, research summaries, status updates — built to be read.",
  invoice: "Invoices that look professional and get paid faster.",
  letter: "Formal letters, cover letters, recommendation letters — pixel-perfect on every print.",
  deck: "One-page decks and proposal cards. Designed to print AND skim.",
  brief: "Strategy briefs, creative briefs, client briefs — short, dense, decisive.",
  proposal: "Proposals that close. Cover page, scope, terms, signature.",
  contract: "Plain-English contracts and SOWs you can actually understand.",
  memo: "Sharp internal memos that respect the reader's time.",
  essay: "Essays formatted for editors: clean margins, footnotes, readable type.",
  guide: "Step-by-step how-to guides with diagrams and takeaways.",
  manual: "Product manuals, employee handbooks, SOPs — built for skimming.",
  flyer: "Single-page flyers and posters with strong type and bold hierarchy.",
  newsletter: "Newsletters that look like print, read like a chat.",
  menu: "Restaurant menus, drink lists, tasting cards — composed and printable.",
  form: "Forms with the layout right the first time. Fillable, signable.",
  agenda: "Meeting agendas, retreat schedules, conference programs.",
  notes: "Meeting notes, lecture notes, study notes — exported as PDFs to share.",
  summary: "Executive summaries and TL;DR briefs — the page everyone reads.",
};

const fmtRelative = (v: number | string) => {
  const ts = typeof v === "string" ? Date.parse(v) : v;
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export default function Tag() {
  const { tag = "" } = useParams<{ tag: string }>();
  const normalized = tag.toLowerCase();
  const navigate = useNavigate();
  const api = useApi();
  const valid = ALLOWED_TAG_RE.test(normalized);
  const titleCase = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const intro =
    TAG_INTROS[normalized] ??
    `Public PDFs tagged "${normalized}". Open any, then remix it to your account.`;

  useDocumentTitle(valid ? `${titleCase} PDFs — Community templates` : "Tag not found");

  const [projects, setProjects] = useState<PublicProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sort: "trending", limit: "30", tag: normalized });
        const res = await api<{ projects: PublicProjectSummary[] }>(`/api/explore?${params.toString()}`);
        setProjects(res.projects);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, normalized, valid]);

  useEffect(() => {
    captureEvent("tag_view", { tag: normalized, valid });
  }, [normalized, valid]);

  // Per-route metadata — SSR-injected for crawlers + AI search citation
  useEffect(() => {
    if (!valid) return;
    const origin = window.location.origin;
    const url = `${origin}/t/${normalized}`;
    const desc = `${intro} ${projects.length} public ${titleCase.toLowerCase()} PDFs on Megabyte PDF.`.slice(0, 156);

    const setMeta = (selector: string, attr: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        const [name, value] = selector.replace(/[[\]"']/g, "").split("=");
        el.setAttribute((name ?? "").replace("meta", "").trim() || "name", value || "");
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:title"]', "content", `${titleCase} PDFs — Community templates`);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:title"]', "content", `${titleCase} PDFs`);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setLink("canonical", url);
    setLink("alternate", `${origin}/feed.xml?tag=${normalized}`);

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": url,
          name: `${titleCase} PDFs`,
          description: intro,
          url,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            { "@type": "ListItem", position: 2, name: "Explore", item: `${origin}/explore` },
            { "@type": "ListItem", position: 3, name: titleCase, item: url },
          ],
        },
      ],
    };
    let ld = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]#tag-jsonld');
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "tag-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, [valid, normalized, titleCase, intro, projects.length]);

  const featured = useMemo(() => projects.slice(0, 3), [projects]);
  const rest = useMemo(() => projects.slice(3), [projects]);

  if (!valid) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-3">Tag not found</h1>
          <p className="text-[var(--color-muted)] mb-6">
            Tags must be lowercase letters, numbers, and hyphens.
          </p>
          <Link to="/explore" className="btn btn-primary text-sm">
            <ArrowLeft size={14} /> Browse all PDFs
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">
        <section className="border-b border-[var(--color-line)] bg-gradient-to-b from-[var(--color-cyan)]/[0.04] to-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-1.5">
              <Link to="/" className="hover:text-[var(--color-fg)]">Home</Link>
              <span className="opacity-50">/</span>
              <Link to="/explore" className="hover:text-[var(--color-fg)]">Explore</Link>
              <span className="opacity-50">/</span>
              <span className="text-[var(--color-fg)]">{titleCase}</span>
            </nav>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-4">
              <TagIcon size={12} />
              <span>Tag</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
              {titleCase} PDFs
            </h1>
            <p className="text-[var(--color-muted)] text-base sm:text-lg max-w-2xl mb-6">
              {intro}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link to="/dashboard" className="btn btn-primary text-sm">
                Make a {titleCase.toLowerCase()} <ArrowRight size={14} />
              </Link>
              <a
                href={`/feed.xml?tag=${normalized}`}
                className="btn btn-ghost text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                aria-label={`Subscribe to ${titleCase} RSS feed`}
              >
                <Rss size={12} /> RSS
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {error && (
            <div role="alert" className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-3">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[var(--color-cyan)]" />
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[var(--color-muted)] mb-4">
                No public PDFs tagged "{normalized}" yet. Be the first.
              </p>
              <Link to="/dashboard" className="btn btn-primary text-sm">
                Make one <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {!loading && featured.length > 0 && (
            <>
              <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-4">
                Trending
              </h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
                {featured.map((p) => (
                  <TagCard key={p.id} project={p} featured onClick={() => navigate(`/c/${p.slug}`)} />
                ))}
              </div>
            </>
          )}

          {!loading && rest.length > 0 && (
            <>
              <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-4">
                More
              </h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rest.map((p) => (
                  <TagCard key={p.id} project={p} onClick={() => navigate(`/c/${p.slug}`)} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function TagCard({
  project,
  featured,
  onClick,
}: {
  project: PublicProjectSummary;
  featured?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`card text-left p-0 overflow-hidden group hover:border-[var(--color-cyan)]/60 transition-all ${
        featured ? "ring-1 ring-[var(--color-cyan)]/20" : ""
      }`}
      style={{ minHeight: 200 }}
    >
      <div
        className="aspect-[4/3] bg-gradient-to-br from-[var(--color-card)] to-black/40 border-b border-[var(--color-line)] flex items-center justify-center relative"
        aria-hidden="true"
      >
        <div className="text-4xl opacity-20 font-bold tracking-tighter">PDF</div>
        <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[var(--color-muted)] uppercase tracking-wider">
          {project.pageSize}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-[var(--color-cyan)] transition-colors">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-3">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-muted)]">
          {project.author?.name && <span className="truncate">by {project.author.name}</span>}
          <span className="opacity-40">·</span>
          <span>{fmtRelative(project.updatedAt)}</span>
          {project.viewCount > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Eye size={10} />
                {project.viewCount}
              </span>
            </>
          )}
          {project.editCount > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Pencil size={10} />
                {project.editCount}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
