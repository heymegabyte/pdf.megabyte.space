import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Headphones, Sparkles } from "lucide-react";
import {
  getPost,
  relatedPosts,
  type BlogBlock,
  type BlogPost as BlogPostType,
} from "../data/blog";
import { getBlogContent } from "../data/blog-content";
import { getTemplate, CATEGORY_LABELS as TEMPLATE_CAT_LABELS } from "../data/templates-hub";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { RichContentSections } from "../components/RichContentSections";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApi } from "../lib/api";
import { captureEvent } from "../lib/analytics";
import type { PublicProjectSummary } from "../lib/types";

interface Props {
  // Optional override slug — used for keyword landing routes where slug isn't in URL params
  fixedSlug?: string;
}

export default function BlogPost({ fixedSlug }: Props) {
  const { slug: paramSlug = "" } = useParams<{ slug: string }>();
  const slug = fixedSlug ?? paramSlug;
  const post = getPost(slug);
  if (!post) return <Navigate to="/blog" replace />;
  return <Inner post={post} />;
}

function Inner({ post }: { post: BlogPostType }) {
  useDocumentTitle(post.title);
  const api = useApi();
  const [community, setCommunity] = useState<PublicProjectSummary[]>([]);

  useEffect(() => {
    captureEvent("blog_post_view", { slug: post.slug, kind: post.kind });
  }, [post.slug, post.kind]);

  useEffect(() => {
    const origin = window.location.origin;
    const path = post.kind === "landing" ? `/${post.slug}` : `/blog/${post.slug}`;
    const url = `${origin}${path}`;

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

    const ogImage = post.heroImage || `${origin}/og/blog/${post.slug}.png`;
    const ogImageType = post.heroImage ? "image/jpeg" : "image/png";
    setMeta('meta[name="description"]', "content", post.metaDescription);
    setMeta('meta[property="og:title"]', "content", post.title);
    setMeta('meta[property="og:description"]', "content", post.metaDescription);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", post.kind === "landing" ? "website" : "article");
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:image:secure_url"]', "content", ogImage);
    setMeta('meta[property="og:image:width"]', "content", "1200");
    setMeta('meta[property="og:image:height"]', "content", "630");
    setMeta('meta[property="og:image:alt"]', "content", post.h1);
    setMeta('meta[property="og:image:type"]', "content", ogImageType);
    setMeta('meta[name="twitter:title"]', "content", post.title);
    setMeta('meta[name="twitter:description"]', "content", post.metaDescription);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:image"]', "content", ogImage);
    setMeta('meta[name="twitter:image:alt"]', "content", post.h1);
    setLink("canonical", url);

    const breadcrumb = post.kind === "landing"
      ? [
          { "@type": "ListItem", position: 1, name: "Home", item: origin },
          { "@type": "ListItem", position: 2, name: post.h1, item: url },
        ]
      : [
          { "@type": "ListItem", position: 1, name: "Home", item: origin },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ];

    const blogContent = getBlogContent(post.slug);
    const galleryImages =
      blogContent?.mediaGallery.filter((m) => m.kind !== "search-deeplink" && m.src) ?? [];
    const imageObjects = galleryImages.map((m, idx) => ({
      "@type": "ImageObject",
      "@id": `${url}#image-${idx + 1}`,
      contentUrl: m.src,
      url: m.src,
      name: m.caption ?? m.alt,
      description: m.alt,
      caption: m.caption ?? m.alt,
      ...(m.width ? { width: m.width } : {}),
      ...(m.height ? { height: m.height } : {}),
      creditText: m.attribution,
      creator: { "@type": "Organization", name: m.attribution },
      acquireLicensePage:
        m.source === "pexels"
          ? "https://www.pexels.com/license/"
          : m.source === "unsplash"
            ? "https://unsplash.com/license"
            : m.source === "wikimedia"
              ? "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia"
              : undefined,
      copyrightNotice: m.attribution,
      inLanguage: "en-US",
      isAccessibleForFree: true,
      representativeOfPage: idx === 0,
      isPartOf: { "@id": url },
    }));
    const graph: object[] = [
      {
        "@type": post.kind === "landing" ? "WebPage" : "BlogPosting",
        "@id": url,
        headline: post.h1,
        name: post.title,
        description: post.metaDescription,
        image: post.heroImage,
        datePublished: post.date,
        dateModified: post.date,
        author: { "@type": "Organization", name: "Megabyte PDF" },
        publisher: {
          "@type": "Organization",
          name: "Megabyte PDF",
          url: origin,
        },
        mainEntityOfPage: url,
        keywords: post.tags.join(", "),
        ...(blogContent && blogContent.citations.length > 0
          ? {
              citation: blogContent.citations.map((c) => ({
                "@type": "CreativeWork",
                name: c.apa,
                ...(c.url ? { url: c.url } : {}),
              })),
            }
          : {}),
      },
      ...imageObjects,
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb,
      },
    ];

    // Add HowTo schema where body contains numbered ordered list
    const firstOl = post.body.find((b) => b.type === "ol");
    if (firstOl && firstOl.type === "ol") {
      graph.push({
        "@type": "HowTo",
        name: post.h1,
        description: post.metaDescription,
        step: firstOl.items.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text,
        })),
      });
    }

    const jsonLd = { "@context": "https://schema.org", "@graph": graph };

    let ld = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]#blog-post-jsonld'
    );
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "blog-post-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, [post]);

  // Pull community PDFs matching the post's first tag
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tag = post.tags[0];
        if (!tag) return;
        const res = await api<{ projects: PublicProjectSummary[] }>(
          `/api/explore?tag=${encodeURIComponent(tag)}&sort=popular&limit=6`
        );
        if (!cancelled) setCommunity(res.projects ?? []);
      } catch {
        if (!cancelled) setCommunity([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, post.tags]);

  const related = relatedPosts(post.slug, 3);
  const rich = getBlogContent(post.slug);
  const relatedTpls = post.relatedTemplates
    .map((s) => getTemplate(s))
    .filter((t): t is NonNullable<ReturnType<typeof getTemplate>> => Boolean(t))
    .slice(0, 4);

  const starterPromptCandidate = post.body.find((b) => b.type === "code");
  const starterPrompt =
    starterPromptCandidate && starterPromptCandidate.type === "code"
      ? starterPromptCandidate.text
      : "";
  const guestHref = starterPrompt
    ? `/guest?prompt=${encodeURIComponent(starterPrompt)}`
    : "/guest";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[var(--color-line)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-55"
            style={{
              background: `radial-gradient(700px 380px at 15% 0%, ${post.heroGradient[0]}33, transparent 60%), radial-gradient(700px 380px at 85% 10%, ${post.heroGradient[1]}33, transparent 60%)`,
            }}
          />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)] mb-5">
              <Link to="/" className="hover:text-[var(--color-cyan)]">Home</Link>
              {post.kind === "article" && (
                <>
                  <span className="mx-2 opacity-50">/</span>
                  <Link to="/blog" className="hover:text-[var(--color-cyan)]">Blog</Link>
                </>
              )}
              <span className="mx-2 opacity-50">/</span>
              <span className="text-[var(--color-fg)] line-clamp-1 inline-block max-w-[60vw] align-bottom">
                {post.h1}
              </span>
            </nav>
            <div className="grid lg:grid-cols-[1.5fr_0.5fr] gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-3">
                  <Sparkles size={14} aria-hidden="true" />
                  <span>
                    {post.kind === "article" ? "Article" : "Quick start"}
                    {post.targetKeyword && ` · ${post.targetKeyword}`}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                  {post.h1}
                </h1>
                <p className="mt-5 text-lg text-[var(--color-muted)] leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="mt-5 flex items-center gap-3 text-xs text-[var(--color-muted)]">
                  <span>{formatDate(post.date)}</span>
                  <span>·</span>
                  <span>{post.readingMinutes} min read</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={guestHref} className="btn btn-primary">
                    <Sparkles size={16} aria-hidden="true" />
                    <span className="ml-2">
                      {starterPrompt ? "Try the example" : "Open the editor"}
                    </span>
                  </Link>
                  <Link to="/pdf-template" className="btn btn-ghost">
                    Browse 50 templates
                    <ArrowRight size={16} aria-hidden="true" className="ml-1" />
                  </Link>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[var(--color-line)] shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${post.heroGradient[0]} 0%, ${post.heroGradient[1]} 100%)`,
                }}
              >
                {post.heroImage && (
                  <img
                    src={post.heroImage}
                    alt={post.heroImageAlt ?? ""}
                    loading="eager"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90"
                  />
                )}
                <div className="absolute bottom-4 left-4 right-4 backdrop-blur-sm bg-black/30 rounded-lg p-3 flex items-center gap-3">
                  <div className="text-2xl">{post.heroEmoji}</div>
                  <div className="text-xs text-white/90 leading-tight">
                    {post.tags.slice(0, 3).join(" · ")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article body */}
        <article className="border-b border-[var(--color-line)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
            {post.body.map((block, i) => (
              <BlockRenderer key={i} block={block} />
            ))}

            {/* Podcast embed if present */}
            {post.podcastUrl && (
              <div className="mt-10 card p-5 flex items-start gap-3">
                <Headphones
                  size={18}
                  aria-hidden="true"
                  className="mt-0.5 text-[var(--color-cyan)] shrink-0"
                />
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-sm">Listen on the go</div>
                  <p className="text-xs text-[var(--color-muted)] mb-3 leading-relaxed">
                    Prefer audio? This article has a 5-minute companion episode in the Megabyte PDF
                    podcast feed.
                  </p>
                  <a
                    href={post.podcastUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost text-xs"
                  >
                    Open in Google Podcasts
                    <ArrowRight size={12} aria-hidden="true" className="ml-1" />
                  </a>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="mt-10 pt-6 border-t border-[var(--color-line)] flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--color-muted)] mr-1">Tags:</span>
              {post.tags.map((t) => (
                <Link
                  key={t}
                  to={`/t/${encodeURIComponent(t)}`}
                  className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40 transition-colors"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        </article>

        {/* Rich content extensions — citations + media gallery + references */}
        {rich && (
          <RichContentSections content={rich} eyebrow="Sources and references" />
        )}

        {/* Related templates */}
        {relatedTpls.length > 0 && (
          <section className="border-b border-[var(--color-line)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
                Templates this post mentions
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedTpls.map((t) => (
                  <Link
                    key={t.slug}
                    to={`/pdf-template/${t.slug}`}
                    className="card p-4 group flex flex-col gap-3 hover:border-[var(--color-cyan)]/60 transition-all"
                  >
                    <div
                      aria-hidden="true"
                      className="h-16 rounded-md grid place-items-center text-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${t.gradient[0]} 0%, ${t.gradient[1]} 100%)`,
                      }}
                    >
                      <span>{t.glyph}</span>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-1">
                        {TEMPLATE_CAT_LABELS[t.category]}
                      </div>
                      <div className="font-semibold text-sm leading-tight group-hover:text-[var(--color-cyan)] transition-colors">
                        {t.h1}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Community PDFs in this style */}
        {community.length > 0 && (
          <section className="border-b border-[var(--color-line)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Community PDFs tagged #{post.tags[0]}
                </h2>
                <Link
                  to={`/t/${encodeURIComponent(post.tags[0] ?? "")}`}
                  className="text-xs text-[var(--color-cyan)] hover:underline"
                >
                  See all →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {community.map((p) => (
                  <Link
                    key={p.id}
                    to={`/c/${p.slug}`}
                    className="card p-4 hover:border-[var(--color-cyan)]/60 transition-all flex flex-col gap-2"
                  >
                    <div className="font-semibold text-sm leading-tight line-clamp-2">
                      {p.title}
                    </div>
                    {p.description && (
                      <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between text-[10px] text-[var(--color-muted)] pt-2">
                      <span>{p.viewCount} views</span>
                      <span>{p.author?.name ?? "Anonymous"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section className="border-b border-[var(--color-line)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-5">Keep reading</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={r.kind === "landing" ? `/${r.slug}` : `/blog/${r.slug}`}
                    className="card overflow-hidden flex flex-col group hover:border-[var(--color-cyan)]/60 transition-all"
                  >
                    <div
                      aria-hidden="true"
                      className="relative aspect-[16/9]"
                      style={{
                        background: `linear-gradient(135deg, ${r.heroGradient[0]} 0%, ${r.heroGradient[1]} 100%)`,
                      }}
                    >
                      <div className="absolute top-3 left-3 text-2xl">{r.heroEmoji}</div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm leading-tight mb-1.5 group-hover:text-[var(--color-cyan)] transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                        {r.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/blog" className="btn btn-ghost">
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span className="ml-1.5">All blog posts</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="bg-[var(--color-bg-elev)]/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Try Megabyte PDF — free
            </h2>
            <p className="text-[var(--color-muted)] mb-6 max-w-xl mx-auto">
              No template menu. No font picker. Just a sentence and an export.
            </p>
            <Link to={guestHref} className="btn btn-primary">
              <Sparkles size={16} aria-hidden="true" />
              <span className="ml-2">Open the editor</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function BlockRenderer({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-[var(--color-fg)] leading-relaxed text-base mb-5">{block.text}</p>
      );
    case "h2":
      return (
        <h2
          className="text-2xl font-bold tracking-tight mt-10 mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="text-lg font-semibold mt-7 mb-3">{block.text}</h3>
      );
    case "quote":
      return (
        <blockquote className="my-7 border-l-2 border-[var(--color-cyan)] pl-5 italic text-[var(--color-muted)] leading-relaxed">
          <p className="mb-2">{block.text}</p>
          {block.cite && (
            <cite className="text-xs not-italic text-[var(--color-muted)]/80">— {block.cite}</cite>
          )}
        </blockquote>
      );
    case "ul":
      return (
        <ul className="mb-6 space-y-2 list-disc list-outside pl-5">
          {block.items.map((it, i) => (
            <li key={i} className="text-[var(--color-fg)] leading-relaxed">
              {it}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mb-6 space-y-2 list-decimal list-outside pl-5">
          {block.items.map((it, i) => (
            <li key={i} className="text-[var(--color-fg)] leading-relaxed">
              {it}
            </li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre className="my-6 card p-5 overflow-x-auto">
          <code className="font-mono text-sm text-[var(--color-fg)] whitespace-pre-wrap leading-relaxed">
            {block.text}
          </code>
        </pre>
      );
    case "callout":
      return (
        <aside className="my-7 card p-5 border-l-2 border-[var(--color-cyan)]">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-2">
            {block.title}
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">{block.body}</p>
        </aside>
      );
    case "image":
      return (
        <figure className="my-7">
          <img
            src={block.src}
            alt={block.alt}
            loading="lazy"
            className="rounded-lg border border-[var(--color-line)] w-full"
          />
          {block.caption && (
            <figcaption className="text-xs text-[var(--color-muted)] mt-2 text-center italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
  }
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
