import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Download,
  Layers,
  Sparkles,
  Check,
  Crown,
  ChevronDown,
  Code2,
  Eye,
  X,
  Music,
  Mail,
  Globe,
  Ghost,
  EyeOff,
  ShieldCheck,
  Brain,
  Scale,
  BookOpen,
  Quote,
} from "lucide-react";
import { captureEvent } from "../lib/analytics";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Footer } from "../components/Footer";
import { PodcastTeaser } from "../components/PodcastTeaser";

interface Reference {
  id: string;
  apa: string;
  url?: string;
}

const REFERENCES: Reference[] = [
  {
    id: "delgado-2018",
    apa: "Delgado, P., Vargas, C., Ackerman, R., & Salmerón, L. (2018). Don't throw away your printed books: A meta-analysis on the effects of reading media on reading comprehension. Educational Research Review, 25, 23–38.",
    url: "https://doi.org/10.1016/j.edurev.2018.09.003",
  },
  {
    id: "mangen-2013",
    apa: "Mangen, A., Walgermo, B. R., & Brønnick, K. (2013). Reading linear texts on paper versus computer screen: Effects on reading comprehension. International Journal of Educational Research, 58, 61–68.",
    url: "https://doi.org/10.1016/j.ijer.2012.12.002",
  },
  {
    id: "singer-alexander-2017",
    apa: "Singer, L. M., & Alexander, P. A. (2017). Reading on paper and digitally: What the past decades of empirical research reveal. Review of Educational Research, 87(6), 1007–1041.",
    url: "https://doi.org/10.3102/0034654317722961",
  },
  {
    id: "sellen-harper-2003",
    apa: "Sellen, A. J., & Harper, R. H. R. (2003). The myth of the paperless office. MIT Press.",
    url: "https://mitpress.mit.edu/9780262692830/the-myth-of-the-paperless-office/",
  },
  {
    id: "mangen-kuiken-2014",
    apa: "Mangen, A., & Kuiken, D. (2014). Lost in an iPad: Narrative engagement on paper and tablet. Scientific Study of Literature, 4(2), 150–177.",
    url: "https://doi.org/10.1075/ssol.4.2.02man",
  },
  {
    id: "kong-2018",
    apa: "Kong, Y., Seo, Y. S., & Zhai, L. (2018). Comparison of reading performance on screen and on paper: A meta-analysis. Computers & Education, 123, 138–149.",
    url: "https://doi.org/10.1016/j.compedu.2018.05.005",
  },
  {
    id: "wastlund-2005",
    apa: "Wästlund, E., Reinikka, H., Norlander, T., & Archer, T. (2005). Effects of VDT and paper presentation on consumption and production of information: Psychological and physiological factors. Computers in Human Behavior, 21(2), 377–394.",
    url: "https://doi.org/10.1016/j.chb.2004.02.007",
  },
  {
    id: "wolf-2018",
    apa: "Wolf, M. (2018). Reader, come home: The reading brain in a digital world. Harper.",
    url: "https://www.harpercollins.com/products/reader-come-home-maryanne-wolf",
  },
  {
    id: "carr-2010",
    apa: "Carr, N. (2010). The shallows: What the Internet is doing to our brains. W. W. Norton.",
    url: "https://www.nicholascarr.com/?page_id=16",
  },
  {
    id: "naumann-2015",
    apa: "Naumann, J. (2015). A model of online reading engagement: The role of motivational factors, attention to reading goals, and cognitive abilities. Computers in Human Behavior, 53, 263–277.",
    url: "https://doi.org/10.1016/j.chb.2015.06.051",
  },
  {
    id: "annisette-2017",
    apa: "Annisette, L. E., & Lafreniere, K. D. (2017). Social media, texting, and personality: A test of the shallowing hypothesis. Personality and Individual Differences, 115, 154–158.",
    url: "https://doi.org/10.1016/j.paid.2016.02.043",
  },
  {
    id: "sundar-marathe-2010",
    apa: "Sundar, S. S., & Marathe, S. S. (2010). Personalization versus customization: The importance of agency, privacy, and power usage. Human Communication Research, 36(3), 298–322.",
    url: "https://doi.org/10.1111/j.1468-2958.2010.01377.x",
  },
  {
    id: "pierce-2003",
    apa: "Pierce, J. L., Kostova, T., & Dirks, K. T. (2003). The state of psychological ownership: Integrating and extending a century of research. Review of General Psychology, 7(1), 84–107.",
    url: "https://doi.org/10.1037/1089-2680.7.1.84",
  },
  {
    id: "jicmail-2024",
    apa: "JICMail. (2024). Item Engagement Quarterly Report: Q4 2024. Joint Industry Committee for Mail Data.",
    url: "https://jicmail.org.uk/data/quarterly-reports/",
  },
  {
    id: "dma-2024",
    apa: "Data & Marketing Association. (2024). Response rate report 2024. ANA / DMA.",
    url: "https://thedma.org/marketing-insights/response-rate-report/",
  },
  {
    id: "ackerman-goldsmith-2011",
    apa: "Ackerman, R., & Goldsmith, M. (2011). Metacognitive regulation of text learning: On screen versus on paper. Journal of Experimental Psychology: Applied, 17(1), 18–32.",
    url: "https://doi.org/10.1037/a0022086",
  },
  {
    id: "noyes-garland-2008",
    apa: "Noyes, J. M., & Garland, K. J. (2008). Computer- vs. paper-based tasks: Are they equivalent? Ergonomics, 51(9), 1352–1375.",
    url: "https://doi.org/10.1080/00140130802170387",
  },
  {
    id: "iso-32000",
    apa: "International Organization for Standardization. (2020). Document management — Portable document format — Part 2: PDF 2.0 (ISO 32000-2:2020).",
    url: "https://www.iso.org/standard/75839.html",
  },
  {
    id: "adobe-pdf-history",
    apa: "Warnock, J. (1991). The Camelot Project. Adobe Systems Incorporated. (Internal technical memo introducing what became PDF.)",
    url: "https://www.planetpdf.com/planetpdf/pdfs/warnock_camelot.pdf",
  },
  {
    id: "wcag-2-2",
    apa: "World Wide Web Consortium. (2023). Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation.",
    url: "https://www.w3.org/TR/WCAG22/",
  },
  {
    id: "cf-browser-rendering",
    apa: "Cloudflare. (2024). Browser Rendering API — Generating PDFs with headless Chromium. Cloudflare Workers documentation.",
    url: "https://developers.cloudflare.com/browser-rendering/",
  },
];

const REF_INDEX: Record<string, number> = REFERENCES.reduce((acc, r, i) => {
  acc[r.id] = i + 1;
  return acc;
}, {} as Record<string, number>);

function Cite({ refId }: { refId: string }) {
  const n = REF_INDEX[refId];
  if (!n) return null;
  return (
    <a
      href={`#ref-${refId}`}
      onClick={() => captureEvent("landing_cite_click", { refId })}
      className="align-super text-[0.6em] font-semibold text-[var(--color-cyan)] hover:underline no-underline ml-0.5"
      aria-label={`Reference ${n}`}
    >
      [{n}]
    </a>
  );
}

interface FeaturedPdf {
  slug: string;
  title: string;
  description: string | null;
  viewCount: number;
  tags: string[];
  author: { name: string | null; imageUrl: string | null } | null;
}

const COMPETITORS = [
  { feature: "Chat-to-PDF (plain English prompt)", us: true, panda: false, doc: false, acro: false, jas: true },
  { feature: "Live page-by-page preview (8.5×11)", us: true, panda: false, doc: false, acro: true, jas: false },
  { feature: "Edit raw HTML/CSS source", us: true, panda: false, doc: false, acro: false, jas: false },
  { feature: "Real PDF export (selectable text)", us: true, panda: true, doc: true, acro: true, jas: true },
  { feature: "Version snapshot per AI turn", us: true, panda: false, doc: false, acro: false, jas: false },
  { feature: "Public share link", us: true, panda: true, doc: true, acro: false, jas: false },
  { feature: "Anonymous trial — no signup", us: true, panda: false, doc: false, acro: false, jas: false },
  { feature: "Starts at $9/mo (or free)", us: true, panda: false, doc: false, acro: false, jas: false },
  { feature: "Unlimited projects tier ($50/mo)", us: true, panda: false, doc: false, acro: false, jas: false },
];

const SISTER_SITES = [
  { url: "https://megabyte.space", title: "Megabyte Labs", desc: "Open-source studio & engineering crew.", icon: Globe, accent: "var(--color-cyan)" },
  { url: "https://music.megabyte.space", title: "Megabyte Music", desc: "Generative scores & lossless web player.", icon: Music, accent: "#7C3AED" },
  { url: "https://ghost.megabyte.space", title: "Megabyte Ghost", desc: "Long-form journal — engineering essays.", icon: Ghost, accent: "#50AAE3" },
  { url: "https://hello.megabyte.space", title: "Hello Megabyte", desc: "Brian's portfolio + contact bridge.", icon: Mail, accent: "var(--color-cyan)" },
];

const FAQ_ITEMS = [
  {
    q: "How does Megabyte PDF work?",
    a: "Type a prompt — \"create a two-page invoice for $4,500 of consulting work\" — and the AI writes the HTML and CSS for a print-ready 8.5 × 11 document. You see every page render in real time. Hit Download to get a real PDF.",
  },
  {
    q: "Do I need an account to try it?",
    a: "No. Guest mode gives you 10 AI prompts per day with live preview in your browser. Sign up (free) to save projects and build on them across sessions.",
  },
  {
    q: "Can I download a real PDF?",
    a: "Yes — Pro ($9/mo) and Unlimited ($50/mo) get true PDF exports generated by Cloudflare Browser Rendering. The file has selectable text, embedded fonts, and correct page dimensions. Guest and Free tiers see the live preview only.",
  },
  {
    q: "What does Unlimited get me at $50/mo?",
    a: "Everything in Pro plus unlimited projects, 500 PDF exports per day, 2,000 AI prompts per day across both the document editor and the assistant. Built for agencies, prolific writers, and anyone who hits the Pro caps.",
  },
  {
    q: "What kinds of documents can it make?",
    a: "Invoices, resumes, reports, contracts, proposals, cover letters, technical specs — anything that maps to a printed page. If you can describe it in plain English, Megabyte PDF can draft it.",
  },
  {
    q: "Can I share a document with a client?",
    a: "Pro users get a public share link. Recipients see a read-only preview of your document — no account required on their end.",
  },
  {
    q: "How do version snapshots work?",
    a: "Every AI response creates a snapshot. You can restore any previous version of your document with one click — handy when a prompt takes the design in the wrong direction.",
  },
];

const ROTATOR_WORDS = [
  "printable PDF",
  "polished invoice",
  "winning resume",
  "tight contract",
  "killer proposal",
  "crisp report",
];

function WordRotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % ROTATOR_WORDS.length), 2400);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className="word-rotator" aria-live="polite">
      <span className="word-rotator-sr" aria-hidden="true">
        {ROTATOR_WORDS[0]}
      </span>
      {ROTATOR_WORDS.map((w, idx) => (
        <span
          key={w}
          className="word-rotator-item"
          data-active={idx === i ? "true" : "false"}
          aria-hidden={idx !== i}
        >
          <span className="bg-gradient-to-r from-[var(--color-cyan)] to-[#7C3AED] bg-clip-text text-transparent">
            {w}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function Landing() {
  useDocumentTitle("Chat your way to print-perfect PDFs");
  const heroRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    function onMove(e: PointerEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el!.style.setProperty("--spot-x", `${x}%`);
        el!.style.setProperty("--spot-y", `${y}%`);
      });
    }
    el.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
    };
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-cyan)] focus:text-[#060610] focus:rounded-md focus:font-semibold focus:text-sm">Skip to content</a>
      <header className="px-6 lg:px-10 py-5 flex items-center justify-between border-b border-[var(--color-line)]">
        <Link to="/" aria-label="Megabyte PDF home">
          <Logo size={32} />
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2">
          <Link to="/sign-in" className="btn btn-ghost text-sm px-3 py-2 underline-hover" aria-label="Sign in" onClick={() => captureEvent("landing_nav_signin")}>
            Sign in
          </Link>
          <Link to="/sign-in" className="btn btn-primary text-sm px-3 py-2" onClick={() => captureEvent("landing_nav_getstarted")}>
            Get started <ArrowRight size={14} className="hidden sm:block" />
          </Link>
        </nav>
      </header>

      <main id="main-content" className="flex-1">
        <section ref={heroRef} className="relative overflow-hidden">
          <div className="aurora" aria-hidden="true" />
          <picture aria-hidden="true">
            <source media="(max-width: 640px)" srcSet="/hero-papers-mobile.webp" type="image/webp" />
            <img
              src="/hero-papers.webp"
              alt=""
              className="hero-papers"
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <div className="spotlight" aria-hidden="true" />
          <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-20 lg:pt-32 pb-16 text-center animate-fade-in-up relative">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-6">
              <span className="size-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
              Print-perfect PDFs from a chat
            </p>
            <h1
              className="text-5xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.05] mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Chat your way to a <WordRotator />.
            </h1>
            <p className="text-lg lg:text-xl text-[var(--color-muted)] max-w-2xl mx-auto text-pretty mb-6">
              Prompt the AI. Watch every page render in real time at 8.5 × 11. Download a real
              PDF — text-selectable, print-ready, your name on it.
            </p>
            <p className="text-sm lg:text-base text-[var(--color-fg)]/85 max-w-2xl mx-auto text-pretty mb-10 leading-relaxed">
              Email gets skimmed. Slack gets muted. A great-looking PDF gets <em>read</em> —
              alone, on the reader's own clock, where the ego falls away
              <Cite refId="annisette-2017" /> and the medium itself becomes
              the trust signal.<Cite refId="sellen-harper-2003" />
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/guest" className="btn btn-primary text-base px-6 py-3" onClick={() => captureEvent("landing_hero_try_guest")}>
                <Sparkles size={18} /> Try it now — no signup
              </Link>
              <Link to="/sign-in" className="btn btn-ghost text-base px-6 py-3 underline-hover" onClick={() => captureEvent("landing_hero_signup")}>
                Create an account <ArrowRight size={16} />
              </Link>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-6">
              10 free guest prompts a day. Sign in to save, share, and download real PDFs.
            </p>
          </div>
        </section>

        {/* Paper philosophy — why paper still wins */}
        <PaperPhilosophy />

        <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Feature
              icon={<MessageSquare size={20} />}
              title="Prompt, don't fuss"
              body="Tell the AI what you need. It writes print-ready HTML and CSS — you just review and adjust."
            />
            <Feature
              icon={<Layers size={20} />}
              title="Every page on screen"
              body="See each page in a vertical stack at 8.5 × 11. Scroll through like a stack of paper."
            />
            <Feature
              icon={<Download size={20} />}
              title="Real PDFs"
              body="True PDF export — text-selectable, embedded fonts, exact page dimensions. Not a screenshot."
            />
            <Feature
              icon={<Code2 size={20} />}
              title="Edit the source"
              body="Open the code panel, tweak HTML and CSS directly, see the preview update in real time."
            />
          </div>
        </section>

        {/* Document types */}
        <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--color-muted)] mb-6">Works for any document</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Invoice", "Resume", "Cover letter", "NDA", "Contract",
              "Business proposal", "Report", "Statement of work",
              "Meeting agenda", "Certificate", "Letterhead", "Spec sheet",
            ].map((t) => (
              <span
                key={t}
                className="px-3 py-1.5 rounded-full text-sm border border-[var(--color-line)] text-[var(--color-muted)] bg-[var(--color-bg-card)]"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* Research-backed stats */}
        <ResearchStats />

        {/* Featured PDFs — "I want gorgeous PDFs like this." */}
        <FeaturedSection />

        {/* Competitor comparison */}
        <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24" id="vs">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-3">Honest comparison</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3 text-balance" style={{ fontFamily: "var(--font-display)" }}>
              How Megabyte PDF stacks up.
            </h2>
            <p className="text-[var(--color-muted)] max-w-xl mx-auto text-pretty">
              Other tools want you to drag boxes around a canvas. We let you type a sentence.
            </p>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th scope="col" className="text-left px-5 py-4 font-semibold">Capability</th>
                  <th scope="col" className="px-3 py-4 font-semibold text-[var(--color-cyan)]">Megabyte PDF</th>
                  <th scope="col" className="px-3 py-4 font-medium text-[var(--color-muted)]">PandaDoc</th>
                  <th scope="col" className="px-3 py-4 font-medium text-[var(--color-muted)]">DocuSign</th>
                  <th scope="col" className="px-3 py-4 font-medium text-[var(--color-muted)]">Adobe Acrobat</th>
                  <th scope="col" className="px-3 py-4 font-medium text-[var(--color-muted)]">Jasper</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--color-line)]/60 last:border-0">
                    <td className="px-5 py-3 text-left">{row.feature}</td>
                    <Cell yes={row.us} highlight />
                    <Cell yes={row.panda} />
                    <Cell yes={row.doc} />
                    <Cell yes={row.acro} />
                    <Cell yes={row.jas} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-4 text-center">
            Verified against vendor docs and pricing pages, May 2026. Tell us if we got something wrong — <a href="mailto:hey@megabyte.space" className="underline-hover text-[var(--color-cyan)]">hey@megabyte.space</a>.
          </p>
        </section>

        {/* Sister sites — interlinking */}
        <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)] mb-3">From the Megabyte ecosystem</p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-balance" style={{ fontFamily: "var(--font-display)" }}>
              More tools, same studio.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SISTER_SITES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-5 group transition-colors hover:border-[var(--color-cyan)]/40"
                onClick={() => captureEvent("landing_sister_click", { site: s.title })}
              >
                <div className="size-10 rounded-lg grid place-items-center mb-3" style={{ backgroundColor: `${s.accent}1A`, color: s.accent }}>
                  <s.icon size={18} />
                </div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  {s.title}
                  <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition motion-reduce:transition-none text-[var(--color-cyan)]" />
                </h3>
                <p className="text-xs text-[var(--color-muted)] text-pretty leading-relaxed">{s.desc}</p>
              </a>
            ))}
          </div>
        </section>

        <PodcastTeaser />

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24" id="pricing">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-3 text-balance"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Simple pricing.
            </h2>
            <p className="text-[var(--color-muted)] max-w-md mx-auto">
              Start free. Pay when you need real PDFs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <PricingTier
              name="Guest"
              price="Free"
              sub="no account needed"
              cta="Try now"
              ctaLink="/guest"
              features={[
                "10 AI prompts per day",
                "Live preview in browser",
                "Sonnet model",
              ]}
              locked={[
                "Save projects",
                "PDF download",
                "Share links",
              ]}
            />
            <PricingTier
              name="Free"
              price="$0"
              sub="sign in required"
              cta="Create account"
              ctaLink="/sign-in"
              features={[
                "1 saved project",
                "Full chat history",
                "Sonnet model",
                "Version snapshots",
              ]}
              locked={[
                "PDF download",
                "Share links",
                "Opus model",
              ]}
            />
            <PricingTier
              name="Pro"
              price="$9"
              sub="per month"
              cta="Upgrade to Pro"
              ctaLink="/sign-in"
              highlight
              features={[
                "10 projects",
                "PDF export (real files)",
                "Public share links",
                "Claude Opus 4.7",
                "Sonnet + version history",
                "Cancel anytime",
              ]}
              locked={[]}
            />
            <PricingTier
              name="Unlimited"
              price="$50"
              sub="per month"
              cta="Go Unlimited"
              ctaLink="/sign-in"
              premium
              features={[
                "Unlimited projects",
                "500 PDF exports / day",
                "2,000 AI prompts / day",
                "Opus + Sonnet, no caps",
                "Priority assistant",
                "Public share links",
                "Cancel anytime",
              ]}
              locked={[]}
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 lg:px-10 pb-24">
          <div className="text-center mb-10">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-3 text-balance"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Common questions.
            </h2>
          </div>
          <dl className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </dl>
        </section>

        {/* APA References */}
        <ReferencesSection />

        <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24">
          <div className="card p-8 lg:p-12 text-center">
            <FileText size={32} className="mx-auto mb-4 text-[var(--color-cyan)]" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-3 text-balance"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Built for documents that ship.
            </h2>
            <p className="text-[var(--color-muted)] max-w-xl mx-auto mb-8 text-pretty">
              Every project has its own AI chat history. Snapshots on every turn — restore any
              version. Public share links when you want feedback before you print.
            </p>
            <Link to="/guest" className="btn btn-primary text-base px-6 py-3" onClick={() => captureEvent("landing_footer_cta")}>
              Try it free <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PaperPhilosophy() {
  return (
    <section className="relative max-w-6xl mx-auto px-6 lg:px-10 pb-24" aria-labelledby="paper-philosophy-heading">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-3">
          The case for the printed page
        </p>
        <h2
          id="paper-philosophy-heading"
          className="text-4xl lg:text-6xl font-bold mb-5 text-balance leading-[1.05]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Paper{" "}
          <span className="bg-gradient-to-r from-[var(--color-cyan)] via-[#7C3AED] to-[#50AAE3] bg-clip-text text-transparent">
            never dies.
          </span>
        </h2>
        <p className="text-base lg:text-lg text-[var(--color-muted)] max-w-2xl mx-auto text-pretty">
          The best way to land a complex point on another human is still over a single document
          they can hold, scroll, and re-read on their own time. Four reasons the format wins —
          backed by forty years of cognitive research.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
        <PhilosophyCard
          n="01"
          icon={<EyeOff size={20} />}
          title="The ego falls away."
          body={
            <>
              On a screen, people perform for their feed. On paper, they read for themselves —
              no notification, no Slack ping, no audience to posture for. That privacy is
              where minds actually change.<Cite refId="annisette-2017" />{" "}
              Solo reading on paper engages deeper metacognition than the same text on a
              screen.<Cite refId="ackerman-goldsmith-2011" />
            </>
          }
          quote="“Solo, on paper, on their own clock — that's where the argument actually lands.”"
          accent="var(--color-cyan)"
        />
        <PhilosophyCard
          n="02"
          icon={<ShieldCheck size={20} />}
          title="The medium IS the trust."
          body={
            <>
              A PDF is a commitment. You sat with it. You laid it out. You signed it. The
              format itself is proof you showed up — receipts feel real, contracts feel real,
              proposals feel real.<Cite refId="sellen-harper-2003" /> Printed material is
              touched on average 4.6 times over its lifetime versus a single glance for most
              email.<Cite refId="jicmail-2024" />
            </>
          }
          quote="“A printed deck on the table is proof you took them seriously.”"
          accent="#7C3AED"
        />
        <PhilosophyCard
          n="03"
          icon={<Brain size={20} />}
          title="Comprehension is higher."
          body={
            <>
              Across 54 controlled studies and 171,055 participants, meta-analyses confirm
              paper readers understand more, remember more, and locate information faster than
              screen readers — especially for time-pressured, complex
              text.<Cite refId="delgado-2018" /><Cite refId="singer-alexander-2017" /> If your
              idea is complicated, paper is the medium it survives in.
            </>
          }
          quote="“Complex ideas survive on paper. They drown in a scroll.”"
          accent="#50AAE3"
        />
        <PhilosophyCard
          n="04"
          icon={<Scale size={20} />}
          title="It breaks the unfair game."
          body={
            <>
              A great-looking PDF beats a beautifully crafted email because the email got
              skimmed in a preview pane. A printed proposal beats a Notion link because the
              proposal can't get tab-killed. Paper survives the attention economy by refusing
              to play it.<Cite refId="carr-2010" /><Cite refId="wolf-2018" />
            </>
          }
          quote="“The reader closes every tab — except the one in their hand.”"
          accent="var(--color-cyan)"
        />
      </div>
    </section>
  );
}

function PhilosophyCard({
  n,
  icon,
  title,
  body,
  quote,
  accent,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  quote: string;
  accent: string;
}) {
  return (
    <article
      className="card relative p-7 lg:p-9 group hover:border-[var(--color-cyan)]/40 transition-colors overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, var(--color-bg-card) 0%, color-mix(in oklch, var(--color-bg-card), transparent 30%) 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{ background: accent }}
      />
      <div className="relative flex items-start gap-4 mb-4">
        <span
          className="font-mono text-3xl lg:text-4xl font-bold opacity-30 tabular-nums"
          style={{ color: accent, fontFamily: "var(--font-mono, ui-monospace)" }}
        >
          {n}
        </span>
        <span
          className="size-10 rounded-lg grid place-items-center"
          style={{ background: `color-mix(in oklch, ${accent}, transparent 85%)`, color: accent }}
        >
          {icon}
        </span>
      </div>
      <h3 className="relative text-2xl lg:text-3xl font-bold mb-3 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <p className="relative text-sm lg:text-base text-[var(--color-fg)]/85 leading-relaxed text-pretty mb-5">
        {body}
      </p>
      <figure className="relative pl-4 border-l-2" style={{ borderColor: accent }}>
        <Quote size={14} className="opacity-40 mb-1" style={{ color: accent }} aria-hidden="true" />
        <blockquote className="text-sm italic text-[var(--color-muted)] leading-snug">
          {quote}
        </blockquote>
      </figure>
    </article>
  );
}

function ResearchStats() {
  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24" aria-labelledby="research-heading">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-3">The numbers</p>
        <h2
          id="research-heading"
          className="text-3xl lg:text-5xl font-bold mb-3 text-balance leading-[1.05]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Forty years of research,{" "}
          <span className="bg-gradient-to-r from-[var(--color-cyan)] to-[#7C3AED] bg-clip-text text-transparent">
            same verdict.
          </span>
        </h2>
        <p className="text-base text-[var(--color-muted)] max-w-2xl mx-auto text-pretty">
          The advantage of paper is not nostalgia. It's measured, replicated, and pooled across
          tens of thousands of subjects.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          number="171K+"
          label="participants meta-analyzed"
          sub={
            <>
              Across 54 studies, paper readers consistently outscored screen readers on
              comprehension.<Cite refId="delgado-2018" />
            </>
          }
        />
        <StatCard
          number="6–8%"
          label="comprehension lift on paper"
          sub={
            <>
              Pooled effect size <span className="font-mono">g = 0.21</span> — robust to study
              type, sample, and decade.<Cite refId="delgado-2018" /><Cite refId="kong-2018" />
            </>
          }
        />
        <StatCard
          number="4.6×"
          label="touches per printed document"
          sub={
            <>
              Average lifetime engagement per piece of physical mail — versus one preview
              glance for most email.<Cite refId="jicmail-2024" />
            </>
          }
        />
        <StatCard
          number="34 yrs"
          label="of PDFs and still climbing"
          sub={
            <>
              From Warnock's 1991 Camelot memo<Cite refId="adobe-pdf-history" /> to ISO
              32000-2:2020<Cite refId="iso-32000" /> — the only doc format the whole world
              actually opens.
            </>
          }
        />
      </div>
      <div className="card mt-8 p-6 lg:p-8 grid lg:grid-cols-[auto_1fr] gap-5 items-start">
        <div className="size-12 rounded-xl bg-[var(--color-cyan)]/10 grid place-items-center text-[var(--color-cyan)] shrink-0">
          <BookOpen size={22} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-2">
            The fine print
          </p>
          <p className="text-sm lg:text-base text-[var(--color-fg)]/85 leading-relaxed text-pretty">
            The screen-vs-paper gap is widest where it matters most: when text is informational,
            time-pressured, or genuinely complex.<Cite refId="delgado-2018" /> Casual reading
            tracks roughly equally on both. But contracts, reports, proposals, resumes —
            anything where the reader is supposed to remember what you said — measurably
            performs better when the medium is paper.<Cite refId="mangen-2013" /><Cite refId="singer-alexander-2017" />{" "}
            That is exactly what a print-ready PDF preserves: the cognitive shape of a printed
            page, even when it's read on a glowing rectangle.<Cite refId="cf-browser-rendering" />
          </p>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  number,
  label,
  sub,
}: {
  number: string;
  label: string;
  sub: React.ReactNode;
}) {
  return (
    <div
      className="card p-5 lg:p-6 hover:border-[var(--color-cyan)]/40 transition-colors relative overflow-hidden"
      style={{
        background:
          "linear-gradient(170deg, var(--color-bg-card) 0%, color-mix(in oklch, var(--color-bg-card), transparent 40%) 100%)",
      }}
    >
      <div
        className="text-4xl lg:text-5xl font-bold mb-1 tabular-nums leading-none bg-gradient-to-br from-[var(--color-cyan)] to-[#7C3AED] bg-clip-text text-transparent"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {number}
      </div>
      <p className="text-sm font-semibold text-[var(--color-fg)] mb-2">{label}</p>
      <p className="text-xs text-[var(--color-muted)] leading-relaxed text-pretty">{sub}</p>
    </div>
  );
}

function ReferencesSection() {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="max-w-3xl mx-auto px-6 lg:px-10 pb-24"
      aria-labelledby="references-heading"
    >
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-3">
          We cite our sources
        </p>
        <h2
          id="references-heading"
          className="text-3xl lg:text-4xl font-bold mb-3 text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          References.
        </h2>
        <p className="text-sm text-[var(--color-muted)] max-w-md mx-auto text-pretty">
          Every claim above traces back to a primary source. APA 7th edition.
        </p>
      </div>
      <div className="card p-5 lg:p-7">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) captureEvent("landing_references_open", {});
          }}
          aria-expanded={open}
          aria-controls="references-list"
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <span className="text-sm font-semibold">
            {open ? "Hide" : "Show"} the {REFERENCES.length} references
          </span>
          <ChevronDown
            size={16}
            className="text-[var(--color-muted)] transition-transform duration-200 motion-reduce:transition-none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          />
        </button>
        <ol
          id="references-list"
          aria-hidden={!open}
          className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none mt-0"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <li className="overflow-hidden list-none">
            <ol className="pt-5 space-y-3 text-xs lg:text-sm leading-relaxed">
              {REFERENCES.map((r, i) => (
                <li
                  key={r.id}
                  id={`ref-${r.id}`}
                  className="text-[var(--color-fg)]/85 pl-9 -indent-9 text-pretty target:bg-[var(--color-cyan)]/[0.08] target:rounded-md target:-mx-2 target:px-2 target:py-1 transition-colors"
                >
                  <span className="font-mono font-semibold text-[var(--color-cyan)] inline-block w-7">
                    [{i + 1}]
                  </span>{" "}
                  {r.apa}{" "}
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-cyan)] underline-hover break-words"
                    >
                      {r.url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </li>
        </ol>
      </div>
    </section>
  );
}

function Cell({ yes, highlight = false }: { yes: boolean; highlight?: boolean }) {
  return (
    <td className={`px-3 py-3 text-center ${highlight ? "bg-[var(--color-cyan)]/[0.04]" : ""}`}>
      {yes ? (
        <Check size={16} className={`inline ${highlight ? "text-[var(--color-cyan)]" : "text-[var(--color-fg)]/80"}`} aria-label="Supported" />
      ) : (
        <X size={16} className="inline text-[var(--color-muted)]/50" aria-label="Not supported" />
      )}
    </td>
  );
}

function FeaturedSection() {
  const [items, setItems] = useState<FeaturedPdf[] | null>(null);
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/explore?sort=trending&limit=6")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: unknown) => {
        if (cancelled) return;
        const projects = (data as { projects?: FeaturedPdf[] } | null)?.projects;
        setItems(Array.isArray(projects) ? projects.slice(0, 6) : []);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (errored || (items && items.length === 0)) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24">
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-2">Built by humans like you</p>
          <h2 className="text-3xl lg:text-5xl font-bold text-balance leading-[1.05]" style={{ fontFamily: "var(--font-display)" }}>
            “I want gorgeous PDFs like this.”
          </h2>
          <p className="text-sm text-[var(--color-muted)] mt-2 max-w-lg text-pretty">
            Real documents from real people. One thought after the third tile: <em>I could ship this tomorrow.</em>
          </p>
        </div>
        <Link
          to="/explore?sort=trending"
          className="btn btn-ghost text-sm px-3 py-2 underline-hover"
          onClick={() => captureEvent("landing_featured_explore_all")}
        >
          Explore all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(items ?? Array.from({ length: 6 })).map((p, i) => (
          <FeaturedCard key={(p as FeaturedPdf | undefined)?.slug ?? `s-${i}`} item={p as FeaturedPdf | undefined} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ item }: { item: FeaturedPdf | undefined }) {
  if (!item) {
    return (
      <div className="card p-0 overflow-hidden">
        <div className="aspect-[4/3] bg-[var(--color-bg-card)] animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[var(--color-bg-card)] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-[var(--color-bg-card)] animate-pulse" />
        </div>
      </div>
    );
  }
  return (
    <Link
      to={`/c/${item.slug}`}
      className="card p-0 overflow-hidden group transition-colors hover:border-[var(--color-cyan)]/40"
      onClick={() => captureEvent("landing_featured_card_click", { slug: item.slug })}
    >
      <div className="aspect-[4/3] bg-[var(--color-bg-card)] overflow-hidden relative">
        <img
          src={`/s/thumb/${item.slug}.svg`}
          alt={`Preview of ${item.title}`}
          loading="lazy"
          decoding="async"
          width={1200}
          height={900}
          className="w-full h-full object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02]"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-[var(--color-muted)] mb-3 line-clamp-2 text-pretty leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span className="truncate">
            {item.author?.name ?? "Anonymous"}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Eye size={12} aria-hidden="true" /> {item.viewCount.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = `faq-${q.slice(0, 20).replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="card overflow-hidden">
      <dt>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => { setOpen((v) => !v); if (!open) captureEvent("landing_faq_open", { question: q }); }}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-white/[0.03] transition-colors"
        >
          <span>{q}</span>
          <ChevronDown
            size={16}
            className="text-[var(--color-muted)] shrink-0 transition-transform duration-200 motion-reduce:transition-none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          />
        </button>
      </dt>
      <dd
        id={id}
        aria-hidden={!open}
        className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm text-[var(--color-muted)] text-pretty leading-relaxed">{a}</p>
        </div>
      </dd>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6">
      <div className="size-10 rounded-lg bg-[var(--color-cyan)]/10 grid place-items-center text-[var(--color-cyan)] mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--color-muted)] text-pretty">{body}</p>
    </div>
  );
}

function PricingTier({
  name,
  price,
  sub,
  cta,
  ctaLink,
  features,
  locked,
  highlight = false,
  premium = false,
}: {
  name: string;
  price: string;
  sub: string;
  cta: string;
  ctaLink: string;
  features: string[];
  locked: string[];
  highlight?: boolean;
  premium?: boolean;
}) {
  const accent = premium ? "#7C3AED" : "var(--color-cyan)";
  const accentClass = premium ? "text-[#7C3AED]" : "text-[var(--color-cyan)]";
  return (
    <div
      className={`card p-6 flex flex-col gap-5 ${
        premium
          ? "border-[#7C3AED]/40 bg-gradient-to-b from-[#7C3AED]/10 to-transparent"
          : highlight
          ? "border-[var(--color-cyan)]/40 bg-gradient-to-b from-[var(--color-cyan)]/5 to-transparent"
          : ""
      }`}
    >
      {premium && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] uppercase tracking-widest">
          <Crown size={13} /> Power user
        </div>
      )}
      {highlight && !premium && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-cyan)] uppercase tracking-widest">
          <Crown size={13} /> Most popular
        </div>
      )}
      <div>
        <p className="text-sm text-[var(--color-muted)] mb-1">{name}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {price}
          </span>
          <span className="text-[var(--color-muted)] text-sm">{sub}</span>
        </div>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check size={14} className={`${accentClass} mt-0.5 shrink-0`} />
            {f}
          </li>
        ))}
        {locked.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-muted)] line-through">
            <span className="size-3.5 mt-0.5 shrink-0 rounded-full border border-current inline-block" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={ctaLink}
        className={`btn text-sm w-full justify-center ${
          premium ? "btn-primary" : highlight ? "btn-primary" : "btn-ghost"
        }`}
        style={premium ? { minHeight: 40, background: accent, borderColor: accent } : { minHeight: 40 }}
        onClick={() => captureEvent("landing_pricing_cta", { tier: name })}
      >
        {cta} {(highlight || premium) && <ArrowRight size={14} />}
      </Link>
    </div>
  );
}
