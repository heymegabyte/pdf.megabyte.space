import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { articles, BLOG_POSTS, landings, type BlogPost } from "../data/blog";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { captureEvent } from "../lib/analytics";

const TITLE = "Megabyte PDF blog — prompt-first PDF design notes";
const META_DESC =
  "Design notes, demos, and honest comparisons on chat-to-PDF — typography, grid, AI, and the craft of cinematic documents from a single prompt.";

const CATEGORY_LABELS: Record<BlogPost["category"], string> = {
  guide: "Guides",
  feature: "Features",
  design: "Design",
  ai: "AI",
  landing: "Landing",
};

export default function Blog() {
  useDocumentTitle(TITLE);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<BlogPost["category"] | "all">("all");

  useEffect(() => {
    captureEvent("blog_index_view", {});
    const origin = window.location.origin;
    const url = `${origin}/blog`;
    const setMeta = (selector: string, attr: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        const m = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
        if (m && m[1] && m[2]) el.setAttribute(m[1], m[2]);
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
    setMeta('meta[name="description"]', "content", META_DESC);
    setMeta('meta[property="og:title"]', "content", TITLE);
    setMeta('meta[property="og:description"]', "content", META_DESC);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:title"]', "content", TITLE);
    setMeta('meta[name="twitter:description"]', "content", META_DESC);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setLink("canonical", url);

    const posts = articles();
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Blog",
          "@id": url,
          name: "Megabyte PDF blog",
          description: META_DESC,
          publisher: { "@type": "Organization", name: "Megabyte PDF", url: origin },
        },
        {
          "@type": "ItemList",
          numberOfItems: posts.length,
          itemListElement: posts.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${origin}/blog/${p.slug}`,
            name: p.title,
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            { "@type": "ListItem", position: 2, name: "Blog", item: url },
          ],
        },
      ],
    };
    let ld = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]#blog-index-jsonld'
    );
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "blog-index-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = articles();
    return base.filter((p) => {
      if (activeCat !== "all" && p.category !== activeCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, activeCat]);

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const landingPages = landings();
  const categories: Array<BlogPost["category"] | "all"> = ["all", "guide", "design", "feature", "ai"];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[var(--color-line)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              background:
                "radial-gradient(800px 400px at 20% 0%, rgba(0,229,255,0.18), transparent 60%), radial-gradient(700px 360px at 80% 10%, rgba(124,58,237,0.22), transparent 60%)",
            }}
          />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-4">
              <Sparkles size={14} aria-hidden="true" />
              <span>Notes from the lab</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl">
              Design notes on the{" "}
              <span className="text-[var(--color-cyan)]">prompt-to-PDF era</span>.
            </h1>
            <p className="mt-5 text-lg text-[var(--color-muted)] max-w-2xl leading-relaxed">
              Demos, comparisons, and craft notes on how Claude writes cinematic PDFs from a single
              sentence — typography, grid, color, and the format that refuses to die.
            </p>
          </div>
        </section>

        {/* Search + filter */}
        <section className="sticky top-[57px] z-20 bg-[var(--color-bg)]/95 backdrop-blur border-b border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
            <label className="relative flex-1 max-w-md">
              <span className="sr-only">Search blog posts</span>
              <Search
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts…"
                className="w-full pl-9 pr-3 py-2 rounded-md bg-[var(--color-bg-elev)] border border-[var(--color-line)] text-sm focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-cyan)]"
                style={{ minHeight: 36 }}
              />
            </label>
            <div className="flex flex-wrap gap-1.5 overflow-x-auto" role="tablist" aria-label="Categories">
              {categories.map((c) => (
                <CatChip
                  key={c}
                  label={c === "all" ? "All" : CATEGORY_LABELS[c]}
                  active={activeCat === c}
                  onClick={() => setActiveCat(c)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Featured */}
        {featured && (
          <section className="border-b border-[var(--color-line)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
              <Link
                to={`/blog/${featured.slug}`}
                className="card overflow-hidden grid lg:grid-cols-[1fr_0.9fr] gap-0 hover:border-[var(--color-cyan)]/60 transition-all group"
              >
                <div
                  aria-hidden="true"
                  className="relative aspect-[16/10] lg:aspect-auto"
                  style={{
                    background: `linear-gradient(135deg, ${featured.heroGradient[0]} 0%, ${featured.heroGradient[1]} 100%)`,
                  }}
                >
                  {featured.heroImage && (
                    <img
                      src={featured.heroImage}
                      alt={featured.heroImageAlt ?? ""}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90"
                    />
                  )}
                  <div className="absolute top-4 left-4 text-3xl">{featured.heroEmoji}</div>
                </div>
                <div className="p-6 sm:p-8 flex flex-col">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-2">
                    Featured · {CATEGORY_LABELS[featured.category]}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-3 group-hover:text-[var(--color-cyan)] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-[var(--color-muted)] leading-relaxed mb-4">{featured.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between text-xs text-[var(--color-muted)]">
                    <span>{formatDate(featured.date)} · {featured.readingMinutes} min read</span>
                    <span className="inline-flex items-center gap-1 text-[var(--color-cyan)]">
                      Read <ArrowRight size={12} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Rest of articles */}
        {rest.length > 0 && (
          <section className="border-b border-[var(--color-line)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((p) => (
                  <ArticleCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <section className="border-b border-[var(--color-line)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                No posts match that search. Try clearing the query.
              </p>
            </div>
          </section>
        )}

        {/* Landing pages section — soft cross-link */}
        <section className="border-b border-[var(--color-line)] bg-[var(--color-bg-elev)]/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-3">
              Looking for a specific tool?
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
              Quick-start pages
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {landingPages.map((p) => (
                <Link
                  key={p.slug}
                  to={`/${p.slug}`}
                  className="card p-5 hover:border-[var(--color-cyan)]/60 transition-all flex flex-col gap-3"
                >
                  <div
                    aria-hidden="true"
                    className="h-12 w-12 rounded-md grid place-items-center text-xl"
                    style={{
                      background: `linear-gradient(135deg, ${p.heroGradient[0]} 0%, ${p.heroGradient[1]} 100%)`,
                    }}
                  >
                    {p.heroEmoji}
                  </div>
                  <div>
                    <div className="font-semibold leading-tight mb-1">{p.h1}</div>
                    <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                      {p.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-cyan)] mt-auto">
                    <span>Open</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Stop reading. Start prompting.
            </h2>
            <p className="text-[var(--color-muted)] mb-6 max-w-xl mx-auto">
              Every post on this page was written about the same product. Open it and watch Claude
              write a real PDF in 30 seconds.
            </p>
            <Link to="/guest" className="btn btn-primary">
              <Sparkles size={16} aria-hidden="true" />
              <span className="ml-2">Open the blank prompt</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CatChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " +
        (active
          ? "bg-[var(--color-cyan)] text-[#060610] border-[var(--color-cyan)]"
          : "bg-transparent text-[var(--color-muted)] border-[var(--color-line)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40")
      }
      style={{ minHeight: 30 }}
    >
      {label}
    </button>
  );
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="card overflow-hidden flex flex-col group hover:border-[var(--color-cyan)]/60 transition-all"
    >
      <div
        aria-hidden="true"
        className="relative aspect-[16/9]"
        style={{
          background: `linear-gradient(135deg, ${post.heroGradient[0]} 0%, ${post.heroGradient[1]} 100%)`,
        }}
      >
        {post.heroImage && (
          <img
            src={post.heroImage}
            alt={post.heroImageAlt ?? ""}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90"
          />
        )}
        <div className="absolute top-3 left-3 text-2xl">{post.heroEmoji}</div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-1.5">
          {CATEGORY_LABELS[post.category]}
        </div>
        <h3 className="font-semibold leading-tight mb-2 group-hover:text-[var(--color-cyan)] transition-colors">
          {post.title}
        </h3>
        <p className="text-xs text-[var(--color-muted)] line-clamp-3 leading-relaxed flex-1">
          {post.excerpt}
        </p>
        <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
          <span>{formatDate(post.date)}</span>
          <span>{post.readingMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
