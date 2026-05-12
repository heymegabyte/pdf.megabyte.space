import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Film,
  Layers,
  Palette,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  getTemplate,
  relatedTemplates,
  type TemplateHubEntry,
} from "../data/templates-hub";
import { getTemplateContent } from "../data/template-content";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { RichContentSections } from "../components/RichContentSections";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApi } from "../lib/api";
import { captureEvent } from "../lib/analytics";
import type { PublicProjectSummary } from "../lib/types";

export default function TemplateHubDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const tpl = getTemplate(slug);
  if (!tpl) return <Navigate to="/pdf-template" replace />;
  return <DetailInner tpl={tpl} />;
}

function DetailInner({ tpl }: { tpl: TemplateHubEntry }) {
  useDocumentTitle(tpl.title);
  const api = useApi();
  const [community, setCommunity] = useState<PublicProjectSummary[]>([]);

  useEffect(() => {
    captureEvent("template_hub_detail_view", { slug: tpl.slug });
  }, [tpl.slug]);

  useEffect(() => {
    const origin = window.location.origin;
    const url = `${origin}/pdf-template/${tpl.slug}`;
    const richMeta = getTemplateContent(tpl.slug);
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

    const ogImage = `${origin}/og/template/${tpl.slug}.png`;
    setMeta('meta[name="description"]', "content", tpl.metaDescription);
    setMeta('meta[property="og:title"]', "content", tpl.title);
    setMeta('meta[property="og:description"]', "content", tpl.metaDescription);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:image:secure_url"]', "content", ogImage);
    setMeta('meta[property="og:image:width"]', "content", "1200");
    setMeta('meta[property="og:image:height"]', "content", "630");
    setMeta('meta[property="og:image:alt"]', "content", tpl.h1);
    setMeta('meta[property="og:image:type"]', "content", "image/png");
    setMeta('meta[name="twitter:title"]', "content", tpl.title);
    setMeta('meta[name="twitter:description"]', "content", tpl.metaDescription);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:image"]', "content", ogImage);
    setMeta('meta[name="twitter:image:alt"]', "content", tpl.h1);
    setLink("canonical", url);

    const galleryImages =
      richMeta?.mediaGallery.filter((m) => m.kind !== "search-deeplink" && m.src) ?? [];
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

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": url,
          headline: tpl.h1,
          description: tpl.metaDescription,
          image: galleryImages[0]?.src ? [galleryImages[0].src] : undefined,
          author: { "@type": "Organization", name: "Megabyte PDF" },
          publisher: { "@type": "Organization", name: "Megabyte PDF" },
          datePublished: "2026-05-11",
          mainEntityOfPage: url,
          ...(richMeta && richMeta.citations.length > 0
            ? {
                citation: richMeta.citations.map((c) => ({
                  "@type": "CreativeWork",
                  name: c.apa,
                  ...(c.url ? { url: c.url } : {}),
                })),
              }
            : {}),
        },
        ...imageObjects,
        {
          "@type": "HowTo",
          name: `How to generate a ${tpl.h1.toLowerCase()} PDF in seconds`,
          description: tpl.metaDescription,
          totalTime: "PT2M",
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Type a prompt",
              text: tpl.starterPrompt,
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Claude writes HTML and CSS",
              text: "Real markup and typography, paginated for print.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Export the PDF",
              text: "One tap. Selectable text, embedded fonts, print-ready.",
            },
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            {
              "@type": "ListItem",
              position: 2,
              name: "PDF templates",
              item: `${origin}/pdf-template`,
            },
            { "@type": "ListItem", position: 3, name: tpl.h1, item: url },
          ],
        },
      ],
    };
    let ld = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]#template-detail-jsonld'
    );
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "template-detail-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, [tpl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tag = tpl.communityTags[0];
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
  }, [api, tpl.communityTags]);

  const related = relatedTemplates(tpl.slug, 4);
  const rich = getTemplateContent(tpl.slug);
  const guestHref = `/guest?prompt=${encodeURIComponent(tpl.starterPrompt)}`;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[var(--color-line)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              background: `radial-gradient(700px 380px at 15% 0%, ${tpl.gradient[0]}33, transparent 60%), radial-gradient(700px 380px at 85% 10%, ${tpl.gradient[1]}33, transparent 60%)`,
            }}
          />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)] mb-5">
              <Link to="/" className="hover:text-[var(--color-cyan)]">
                Home
              </Link>
              <span className="mx-2 opacity-50">/</span>
              <Link to="/pdf-template" className="hover:text-[var(--color-cyan)]">
                PDF templates
              </Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-[var(--color-fg)]">{tpl.h1}</span>
            </nav>
            <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-3">
                  <Film size={14} aria-hidden="true" />
                  <span>{CATEGORY_LABELS[tpl.category]}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                  {tpl.h1}
                </h1>
                <p className="mt-5 text-lg text-[var(--color-muted)] leading-relaxed">
                  {tpl.oneLiner}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to={guestHref} className="btn btn-primary">
                    <Sparkles size={16} aria-hidden="true" />
                    <span className="ml-2">Try this prompt</span>
                  </Link>
                  <Link to="/guest" className="btn btn-ghost">
                    Or write your own
                    <ArrowRight size={16} aria-hidden="true" className="ml-1" />
                  </Link>
                </div>
                <p className="mt-4 text-xs text-[var(--color-muted)]">
                  For: {tpl.audience}
                </p>
              </div>
              <div
                aria-hidden="true"
                className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[var(--color-line)] shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${tpl.gradient[0]} 0%, ${tpl.gradient[1]} 100%)`,
                }}
              >
                <div className="absolute inset-4 rounded-lg bg-[#0b0b14]/85 p-6 flex flex-col">
                  <div className="text-5xl mb-3">{tpl.glyph}</div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-cyan)] mb-1">
                    {tpl.slug}
                  </div>
                  <div className="text-base font-semibold leading-tight mb-3">{tpl.h1}</div>
                  <div className="flex flex-col gap-1.5">
                    {[100, 92, 96, 78, 88, 70].map((w, i) => (
                      <div
                        key={i}
                        className="h-1.5 rounded-full bg-white/15"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="text-[10px] text-[var(--color-muted)]">A4 · paginated</div>
                    <div className="text-[10px] text-[var(--color-cyan)]">PDF · selectable</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The cinematic pitch */}
        <section className="border-b border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Why this PDF looks like an art director touched it
                </h2>
                <p className="text-[var(--color-muted)] leading-relaxed mb-4">
                  {tpl.cinematicHook}
                </p>
                <p className="text-[var(--color-muted)] leading-relaxed mb-4">
                  Megabyte PDF runs your prompt through Claude — the same model that writes
                  production code at Anthropic. Claude doesn't pick from a template menu. It writes
                  the document. Real HTML for structure, real CSS for typography and grid, real
                  pagination for print. The result is a single PDF that reads like it was
                  hand-crafted by a magazine designer, except it took 30 seconds.
                </p>
                <p className="text-[var(--color-muted)] leading-relaxed">
                  No drag-and-drop boundaries. No 12-step font submenu. No theme that everyone else
                  is also using. You describe the document in plain English. Claude composes it. The
                  preview is print-true from the first keystroke. You export, you ship, you move on.
                </p>
              </div>
              <ol className="space-y-3">
                {[
                  {
                    icon: <Sparkles size={14} aria-hidden="true" />,
                    title: "Chat in plain English",
                    body: "One line. Claude takes intent and turns it into structure.",
                  },
                  {
                    icon: <Layers size={14} aria-hidden="true" />,
                    title: "Real HTML + CSS",
                    body: "Editable code panel. Push pixels if you want. Skip it if you don't.",
                  },
                  {
                    icon: <Palette size={14} aria-hidden="true" />,
                    title: "On-brand by default",
                    body: "Typography hierarchy, color rhythm, generous margins — never default-stock.",
                  },
                  {
                    icon: <Wand2 size={14} aria-hidden="true" />,
                    title: "Real PDF export",
                    body: "Selectable text. Embedded fonts. Identical on every screen and printer.",
                  },
                ].map((s, i) => (
                  <li key={i} className="card p-4 flex gap-3 items-start">
                    <span className="mt-0.5 grid place-items-center w-7 h-7 rounded-md bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] shrink-0">
                      {s.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-sm mb-0.5">{s.title}</div>
                      <p className="text-xs text-[var(--color-muted)] leading-relaxed">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Starter prompt block */}
        <section className="border-b border-[var(--color-line)] bg-[var(--color-bg-elev)]/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-3">
              Starter prompt
            </div>
            <div className="card p-6">
              <p className="font-mono text-sm sm:text-base text-[var(--color-fg)] leading-relaxed">
                {tpl.starterPrompt}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={guestHref} className="btn btn-primary text-sm">
                  Use this prompt →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(tpl.starterPrompt);
                    captureEvent("template_prompt_copied", { slug: tpl.slug });
                  }}
                  className="btn btn-ghost text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-3">
              Edit anything — Claude will adapt structure, fonts, sections, tone. Iterate until it's
              perfect, then export.
            </p>
          </div>
        </section>

        {/* Rich body + media gallery + references (only when content available) */}
        {rich && (
          <RichContentSections
            content={rich}
            eyebrow="Deep dive"
            heading={`What good ${tpl.h1.toLowerCase()} actually look like`}
          />
        )}

        {/* Features + design notes */}
        <section className="border-b border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-4">What lands on the page</h2>
              <ul className="space-y-2.5">
                {tpl.features.map((f) => (
                  <li key={f} className="flex gap-3 items-start text-sm">
                    <Check
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 text-[var(--color-cyan)] shrink-0"
                    />
                    <span className="text-[var(--color-fg)]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-4">Design choices Claude makes</h2>
              <ul className="space-y-2.5">
                {tpl.designNotes.map((n) => (
                  <li key={n} className="flex gap-3 items-start text-sm">
                    <Palette
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 text-[var(--color-cyan)] shrink-0"
                    />
                    <span className="text-[var(--color-muted)]">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Community PDFs by tag */}
        {community.length > 0 && (
          <section className="border-b border-[var(--color-line)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Live community PDFs in this style
                </h2>
                <Link
                  to={`/t/${encodeURIComponent(tpl.communityTags[0] ?? "")}`}
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

        {/* Related templates */}
        <section className="border-b border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
              Related templates
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/pdf-template/${r.slug}`}
                  className="card p-4 group flex flex-col gap-3 hover:border-[var(--color-cyan)]/60 transition-all"
                >
                  <div
                    aria-hidden="true"
                    className="h-16 rounded-md grid place-items-center text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${r.gradient[0]} 0%, ${r.gradient[1]} 100%)`,
                    }}
                  >
                    <span>{r.glyph}</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-1">
                      {CATEGORY_LABELS[r.category]}
                    </div>
                    <div className="font-semibold text-sm leading-tight group-hover:text-[var(--color-cyan)] transition-colors">
                      {r.h1}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link to="/pdf-template" className="btn btn-ghost">
                <ArrowLeft size={14} aria-hidden="true" />
                <span className="ml-1.5">Browse all 50 templates</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[var(--color-bg-elev)]/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Stop fighting templates. Just chat.
            </h2>
            <p className="text-[var(--color-muted)] mb-6 max-w-xl mx-auto">
              Type the prompt above. Watch Claude write the document. Export the PDF. Ship it.
            </p>
            <Link to={guestHref} className="btn btn-primary">
              <Sparkles size={16} aria-hidden="true" />
              <span className="ml-2">Try this template now</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
