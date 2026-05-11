import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Film, Search, Sparkles, Wand2 } from "lucide-react";
import {
  CATEGORY_LABELS,
  TEMPLATES,
  type TemplateCategory,
  type TemplateHubEntry,
} from "../data/templates-hub";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { captureEvent } from "../lib/analytics";

const TITLE = "50 free PDF templates — chat your way to cinematic docs";
const META_DESC =
  "Pick from 50 chat-to-PDF templates: invoices, resumes, menus, posters, lesson plans. Type a prompt, watch Claude write HTML+CSS, export real PDFs.";

const CATEGORY_ORDER: TemplateCategory[] = [
  "business",
  "personal",
  "marketing",
  "events",
  "education",
  "lifestyle",
];

export default function TemplateHub() {
  useDocumentTitle(TITLE);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<TemplateCategory | "all">("all");

  useEffect(() => {
    captureEvent("template_hub_view", {});
    const origin = window.location.origin;
    const url = `${origin}/pdf-template`;
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
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": url,
          name: TITLE,
          description: META_DESC,
          isPartOf: { "@type": "WebSite", name: "Megabyte PDF", url: origin },
        },
        {
          "@type": "ItemList",
          numberOfItems: TEMPLATES.length,
          itemListElement: TEMPLATES.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${origin}/pdf-template/${t.slug}`,
            name: t.h1,
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            { "@type": "ListItem", position: 2, name: "PDF templates", item: url },
          ],
        },
      ],
    };
    let ld = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]#template-hub-jsonld'
    );
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "template-hub-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      if (activeCat !== "all" && t.category !== activeCat) return false;
      if (!q) return true;
      return (
        t.h1.toLowerCase().includes(q) ||
        t.oneLiner.toLowerCase().includes(q) ||
        t.slug.includes(q) ||
        t.audience.toLowerCase().includes(q) ||
        t.communityTags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [query, activeCat]);

  const grouped = useMemo(() => {
    const map: Record<TemplateCategory, TemplateHubEntry[]> = {
      business: [],
      personal: [],
      marketing: [],
      events: [],
      education: [],
      lifestyle: [],
    };
    for (const t of filtered) map[t.category].push(t);
    return map;
  }, [filtered]);

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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-4">
              <Film size={14} aria-hidden="true" />
              <span>50 cinematic PDF templates</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl">
              Prompt → HTML + CSS → real PDF.{" "}
              <span className="text-[var(--color-cyan)]">No Word doc in sight.</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--color-muted)] max-w-2xl leading-relaxed">
              Fifty starter templates. Each one is a single prompt away from a print-perfect,
              on-brand PDF that looks like an art director touched it — because Claude writes the
              CSS like an art director would.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/guest" className="btn btn-primary">
                <Sparkles size={16} aria-hidden="true" />
                <span className="ml-2">Start from a blank prompt</span>
              </Link>
              <a href="#templates-grid" className="btn btn-ghost">
                Browse 50 templates
                <ArrowRight size={16} aria-hidden="true" className="ml-1" />
              </a>
            </div>
          </div>
        </section>

        {/* The pitch — Claude + HTML/CSS + PDF Export */}
        <section className="border-b border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Why the result is cinematic, not corporate
                </h2>
                <p className="text-[var(--color-muted)] leading-relaxed mb-4">
                  Traditional template editors hand you 200 sliders and a stiff grid. Megabyte PDF
                  hands you Claude — a designer who writes real HTML and CSS, then renders it to a
                  real PDF. The page never compromises with a drag-and-drop boundary. Type face,
                  rhythm, color, hierarchy — all under Claude's pen, all at print resolution.
                </p>
                <p className="text-[var(--color-muted)] leading-relaxed">
                  Every template here is a one-line prompt away from an HBO-quality artifact. The
                  invoice has presence. The resume has a point of view. The recipe card looks like
                  it walked off a magazine. No theme to pick. No font menu to scroll. Just chat.
                </p>
              </div>
              <ol className="space-y-4">
                {[
                  {
                    n: "01",
                    title: "Prompt in plain English",
                    body: "Type one line. \"Invoice for $4,200 to Acme, due in 14 days.\" Claude takes it from there.",
                  },
                  {
                    n: "02",
                    title: "Claude writes HTML + CSS",
                    body: "Real markup, real typography, real grid. Editable code panel if you want to push pixels.",
                  },
                  {
                    n: "03",
                    title: "Live preview, paginated",
                    body: "See the document in print-shape from the first keystroke. A4 or Letter. Margins to spec.",
                  },
                  {
                    n: "04",
                    title: "Export a real PDF",
                    body: "One-tap export. Selectable text. Embedded fonts. Identical on every screen, every printer.",
                  },
                ].map((step) => (
                  <li
                    key={step.n}
                    className="card p-5 flex gap-4 items-start"
                  >
                    <span className="font-mono text-xs text-[var(--color-cyan)] pt-0.5">
                      {step.n}
                    </span>
                    <div>
                      <div className="font-semibold mb-1">{step.title}</div>
                      <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Search + category filter */}
        <section
          id="templates-grid"
          className="sticky top-[57px] z-20 bg-[var(--color-bg)]/95 backdrop-blur border-b border-[var(--color-line)]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
            <label className="relative flex-1 max-w-md">
              <span className="sr-only">Search templates</span>
              <Search
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 50 templates…"
                className="w-full pl-9 pr-3 py-2 rounded-md bg-[var(--color-bg-elev)] border border-[var(--color-line)] text-sm focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-cyan)]"
                style={{ minHeight: 36 }}
              />
            </label>
            <div className="flex flex-wrap gap-1.5 overflow-x-auto" role="tablist" aria-label="Categories">
              <CategoryChip
                label={`All (${TEMPLATES.length})`}
                active={activeCat === "all"}
                onClick={() => setActiveCat("all")}
              />
              {CATEGORY_ORDER.map((cat) => {
                const count = TEMPLATES.filter((t) => t.category === cat).length;
                return (
                  <CategoryChip
                    key={cat}
                    label={`${CATEGORY_LABELS[cat]} (${count})`}
                    active={activeCat === cat}
                    onClick={() => setActiveCat(cat)}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* Grid grouped by category */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-14">
          {CATEGORY_ORDER.map((cat) => {
            const list = grouped[cat];
            if (!list || list.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="text-xs text-[var(--color-muted)] uppercase tracking-[0.18em]">
                    {list.length} templates
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((t) => (
                    <TemplateCard key={t.slug} t={t} />
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-[var(--color-muted)] py-12">
              No templates match that search. Try a category or clear the query.
            </p>
          )}
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--color-line)] bg-[var(--color-bg-elev)]/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
            <Wand2 size={28} aria-hidden="true" className="mx-auto text-[var(--color-cyan)] mb-3" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Don't see what you need? Just prompt it.
            </h2>
            <p className="text-[var(--color-muted)] mb-6 max-w-xl mx-auto">
              These fifty are starting points, not limits. Type any document you can describe — a
              field-trip rubric, a tasting menu, a fundraising one-pager — and Claude writes it.
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

function CategoryChip({
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

function TemplateCard({ t }: { t: TemplateHubEntry }) {
  return (
    <Link
      to={`/pdf-template/${t.slug}`}
      className="card p-5 group flex flex-col gap-3 hover:border-[var(--color-cyan)]/60 transition-all"
    >
      <div
        aria-hidden="true"
        className="h-20 rounded-md grid place-items-center text-3xl"
        style={{
          background: `linear-gradient(135deg, ${t.gradient[0]} 0%, ${t.gradient[1]} 100%)`,
        }}
      >
        <span>{t.glyph}</span>
      </div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-1.5">
          {CATEGORY_LABELS[t.category]}
        </div>
        <h3 className="font-semibold leading-tight mb-1.5 group-hover:text-[var(--color-cyan)] transition-colors">
          {t.h1}
        </h3>
        <p className="text-xs text-[var(--color-muted)] line-clamp-3 leading-relaxed">
          {t.oneLiner}
        </p>
      </div>
      <div className="flex items-center text-xs font-medium text-[var(--color-cyan)]">
        <span>Open template</span>
        <ArrowRight size={12} aria-hidden="true" className="ml-1" />
      </div>
    </Link>
  );
}
