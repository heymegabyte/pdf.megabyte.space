import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Sparkles, Eye, Pencil, ArrowRight, Loader2, Tag, X } from "lucide-react";
import { useApi } from "../lib/api";
import { captureEvent } from "../lib/analytics";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import type { PublicProjectSummary } from "../lib/types";

const fmtRelative = (v: number | string) => {
  const ts = typeof v === "string" ? Date.parse(v) : v;
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

interface TagCount {
  tag: string;
  count: number;
}

interface ExploreResponse {
  projects: PublicProjectSummary[];
  nextCursor: string | null;
  nextOffset: number | null;
}

const PAGE_SIZE = 24;

export default function Explore() {
  useDocumentTitle("Explore — Community PDFs built with AI");
  const api = useApi();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialSort = (searchParams.get("sort") as "recent" | "popular" | "trending") ?? "recent";
  const initialTag = searchParams.get("tag") ?? "";
  const [projects, setProjects] = useState<PublicProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [sort, setSort] = useState<"recent" | "popular" | "trending">(initialSort);
  const [activeTag, setActiveTag] = useState<string>(initialTag);
  const [tagCloud, setTagCloud] = useState<TagCount[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 240);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ tags: TagCount[] }>(`/api/explore/tags`);
        setTagCloud(res.tags);
      } catch {
        /* tag cloud is non-critical */
      }
    })();
  }, [api]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (debounced) {
        const res = await api<{ projects: PublicProjectSummary[] }>(
          `/api/explore/search?q=${encodeURIComponent(debounced)}`
        );
        setProjects(res.projects);
        setNextCursor(null);
        setNextOffset(null);
      } else {
        const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE) });
        if (activeTag) params.set("tag", activeTag);
        const res = await api<ExploreResponse>(`/api/explore?${params.toString()}`);
        setProjects(res.projects);
        setNextCursor(res.nextCursor);
        setNextOffset(res.nextOffset);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [api, debounced, sort, activeTag]);

  const loadMore = useCallback(async () => {
    if (loadingMore || debounced) return;
    if (!nextCursor && nextOffset === null) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE) });
      if (activeTag) params.set("tag", activeTag);
      if (nextCursor) params.set("cursor", nextCursor);
      else if (nextOffset !== null) params.set("offset", String(nextOffset));
      const res = await api<ExploreResponse>(`/api/explore?${params.toString()}`);
      setProjects((prev) => [...prev, ...res.projects]);
      setNextCursor(res.nextCursor);
      setNextOffset(res.nextOffset);
      captureEvent("explore_load_more", { sort, cursor: Boolean(nextCursor) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [api, sort, activeTag, nextCursor, nextOffset, loadingMore, debounced]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debounced) next.set("q", debounced);
    if (sort !== "recent") next.set("sort", sort);
    if (activeTag) next.set("tag", activeTag);
    setSearchParams(next, { replace: true });
  }, [debounced, sort, activeTag, setSearchParams]);

  useEffect(() => {
    captureEvent("explore_view", { query: debounced, sort, tag: activeTag || null });
  }, [debounced, sort, activeTag]);

  // Konami code easter egg — ↑↑↓↓←→←→BA → confetti + I'm-feeling-lucky pick
  const [luckyMode, setLuckyMode] = useState(false);
  useEffect(() => {
    const sequence = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "KeyB", "KeyA",
    ];
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === sequence[idx]) {
        idx += 1;
        if (idx === sequence.length) {
          idx = 0;
          setLuckyMode(true);
          captureEvent("konami_unlocked", { source: "explore" });
          window.setTimeout(() => setLuckyMode(false), 4200);
          if (projects.length) {
            const pick = projects[Math.floor(Math.random() * projects.length)];
            if (pick) window.setTimeout(() => navigate(`/c/${pick.slug}`), 1200);
          }
        }
      } else {
        idx = code === sequence[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projects, navigate]);

  const featured = useMemo(() => projects.slice(0, 3), [projects]);
  const rest = useMemo(() => projects.slice(3), [projects]);
  const hasMore = !debounced && (Boolean(nextCursor) || nextOffset !== null);

  const maxTagCount = useMemo(() => {
    if (!tagCloud.length) return 1;
    return Math.max(...tagCloud.map((t) => t.count));
  }, [tagCloud]);

  const tagSize = (count: number) => {
    const ratio = count / maxTagCount;
    if (ratio > 0.75) return "text-sm";
    if (ratio > 0.5) return "text-xs";
    return "text-[11px]";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      {luckyMode && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[60] pointer-events-none grid place-items-center"
          style={{ animation: "fadeIn 200ms ease" }}
        >
          <div
            className="px-6 py-3 rounded-full bg-[var(--color-cyan)] text-black font-bold text-lg shadow-2xl"
            style={{ animation: "popIn 600ms cubic-bezier(.34,1.56,.64,1)" }}
          >
            🎲 Feeling lucky… opening a random PDF
          </div>
        </div>
      )}
      <main className="flex-1">
        <section className="border-b border-[var(--color-line)] bg-gradient-to-b from-[var(--color-cyan)]/[0.04] to-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-4">
              <Sparkles size={12} />
              <span>Community PDFs</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
              Explore PDFs the community built.
            </h1>
            <p className="text-[var(--color-muted)] text-base sm:text-lg max-w-2xl mb-6">
              Real documents — resumes, reports, decks — designed in plain English. Open one,
              remix it, make it yours.
            </p>
            <div className="relative max-w-xl">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search community PDFs…"
                className="input w-full pl-10 pr-10 py-3 text-base"
                aria-label="Search public PDFs"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="flex-1" />
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[var(--color-muted)] mr-1">Sort</span>
                {(["trending", "recent", "popular"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      sort === s
                        ? "bg-white/[0.08] text-[var(--color-fg)] font-medium"
                        : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                    }`}
                  >
                    {s === "trending" ? "Trending" : s === "recent" ? "Newest" : "Popular"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid lg:grid-cols-[220px_1fr] gap-8">
          <aside className="hidden lg:block">
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-3">
              Tags
            </h2>
            {tagCloud.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">No tags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeTag && (
                  <button
                    onClick={() => setActiveTag("")}
                    className="text-[11px] px-2 py-1 rounded-full bg-[var(--color-cyan)] text-black font-medium inline-flex items-center gap-1"
                    aria-label="Clear tag filter"
                  >
                    {activeTag} <X size={10} />
                  </button>
                )}
                {tagCloud
                  .filter((t) => t.tag !== activeTag)
                  .map((t) => (
                    <button
                      key={t.tag}
                      onClick={() => {
                        setActiveTag(t.tag);
                        captureEvent("explore_tag_click", { tag: t.tag, count: t.count });
                      }}
                      className={`px-2 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/60 hover:text-[var(--color-fg)] transition-colors ${tagSize(
                        t.count
                      )}`}
                      title={`${t.count} PDFs`}
                    >
                      <Tag size={10} className="inline mr-0.5" />
                      {t.tag}
                      <span className="opacity-50 ml-1">{t.count}</span>
                    </button>
                  ))}
              </div>
            )}
          </aside>

          <div>
            {activeTag && (
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setActiveTag("")}
                  className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-cyan)] text-black font-medium inline-flex items-center gap-1"
                >
                  {activeTag} <X size={11} />
                </button>
              </div>
            )}

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
              <div className="text-center py-20 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-cyan)]/15 to-[var(--color-cyan)]/0 border border-[var(--color-cyan)]/20 mb-5">
                  <Sparkles size={26} className="text-[var(--color-cyan)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {debounced
                    ? `Nothing matches "${debounced}"`
                    : activeTag
                    ? `No public PDFs tagged "${activeTag}" yet`
                    : "Be the spark"}
                </h3>
                <p className="text-sm text-[var(--color-muted)] mb-6">
                  {debounced
                    ? "Try a broader keyword, switch sort, or browse trending."
                    : activeTag
                    ? "Publish one with this tag — yours will land at the top."
                    : "Make a PDF, hit Publish, and your work shows up here for the world."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link to="/dashboard" className="btn btn-primary text-sm">
                    Make a PDF <ArrowRight size={14} />
                  </Link>
                  {(debounced || activeTag) && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveTag("");
                      }}
                      className="btn btn-ghost text-sm"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {!loading && featured.length > 0 && !debounced && (
              <>
                <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-4">
                  Featured
                </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
                  {featured.map((p) => (
                    <PdfCard key={p.id} project={p} featured onClick={() => navigate(`/c/${p.slug}`)} />
                  ))}
                </div>
              </>
            )}

            {!loading && (rest.length > 0 || debounced) && (
              <>
                <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-4">
                  {debounced ? "Results" : "All"}
                </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(debounced ? projects : rest).map((p) => (
                    <PdfCard key={p.id} project={p} onClick={() => navigate(`/c/${p.slug}`)} />
                  ))}
                </div>
              </>
            )}

            {!loading && hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn btn-ghost text-sm px-6 py-2.5"
                  aria-label="Load more PDFs"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>Load more</>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function PdfCard({
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
        className="aspect-[4/3] border-b border-[var(--color-line)] relative overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={
            project.thumbnailKey
              ? `/s/preview/${project.slug}.png`
              : `/s/thumb/${project.slug}.svg`
          }
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = `/s/thumb/${project.slug}.svg`;
            if (!img.src.endsWith(fallback)) img.src = fallback;
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
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
          {project.author?.name && (
            <span className="truncate">by {project.author.name}</span>
          )}
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
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[var(--color-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
