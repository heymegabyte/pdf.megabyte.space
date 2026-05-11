import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, Loader2, Sparkles, X } from "lucide-react";
import { useApi } from "../lib/api";
import { captureEvent } from "../lib/analytics";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { TopBar } from "../components/TopBar";
import type { PublicProjectSummary } from "../lib/types";

interface TemplateGuide {
  type: string;
  title: string;
  h1: string;
  intro: string;
  metaDesc: string;
  steps: { name: string; text: string }[];
  dos: string[];
  donts: string[];
  starterPrompt: string;
  audience: string;
}

const GUIDES: Record<string, TemplateGuide> = {
  resume: {
    type: "resume",
    title: "How to write a resume that gets interviews",
    h1: "Write a resume that gets interviews",
    intro:
      "Recruiters spend 7 seconds on a first scan. A great resume earns the next 30 — and the 30 after that. Here's the exact structure that works, plus a one-page template you can remix in 30 seconds.",
    metaDesc:
      "How to write a resume that beats the 7-second scan. Five-step template, do's and don'ts, and one-page samples you can remix.",
    steps: [
      { name: "Lead with outcomes", text: "Top third is prime real estate. Replace 'objective' with three lines: name, current role, and one outcome a hiring manager would steal." },
      { name: "Quantify everything", text: "Numbers beat adjectives. Replace 'improved performance' with 'cut p99 latency 38% across 4 services' or 'closed $1.4M in 11 months'." },
      { name: "One page, one font", text: "Two columns max. One typeface (system-ui or Inter). Generous margins. White space sells competence — density buries it." },
      { name: "Tailor the top, recycle the bottom", text: "Re-order the top three bullets per role you apply to. Education and side projects stay fixed. 90% of the file is reusable." },
      { name: "Export as PDF, not Word", text: "PDFs render identically on every recruiter's screen. Word files reflow, lose fonts, and look unprofessional in 2026." },
    ],
    dos: [
      "Use action verbs in past tense (Shipped, Closed, Reduced)",
      "Include a portfolio or GitHub URL",
      "Match the role's keywords without keyword-stuffing",
      "Add a one-line 'why I want this' at the top of cover letters",
    ],
    donts: [
      "Photos, fancy graphics, or skill bars",
      "Generic objective statements ('seeking a challenging role')",
      "References available on request' — assumed",
      "More than one page unless you have 15+ years",
    ],
    starterPrompt: "One-page resume for a senior software engineer in NYC, focus on backend + distributed systems",
    audience: "Job seekers, recent grads, career changers",
  },
  invoice: {
    type: "invoice",
    title: "How to write an invoice that gets paid",
    h1: "Write an invoice that gets paid",
    intro:
      "A clear invoice gets paid in 14 days. A muddy one gets paid in 60. The difference is the layout — and what you put above the fold.",
    metaDesc:
      "How to write an invoice that gets paid 4x faster. Five-step structure, plain-English terms, and printable samples you can remix.",
    steps: [
      { name: "Lead with the total", text: "Total due in the top-right corner, bold, 32pt. Everything else supports that one number." },
      { name: "Name the invoice", text: "INV-2026-001 in the header. Sequential. Customers track payables by ID, not by client name." },
      { name: "Itemize without padding", text: "Three columns: description, qty, line total. No 'misc' rows. No '+10% admin'. Customers reject vague lines." },
      { name: "Set terms in plain English", text: "'Net 14 — pay by [date]'. Not 'payment terms standard'. State accepted methods (ACH, card, wire) with one fee disclaimer." },
      { name: "Add a single CTA", text: "One link: 'Pay by ACH' or 'Pay by card'. Single tap on phone. Self-serve beats email back-and-forth every time." },
    ],
    dos: [
      "Include your business name, EIN, and remit-to address",
      "Show the customer's PO number if they gave one",
      "List the due date, not just the term ('Pay by Jun 14')",
      "Send a PDF, not a Google Doc link",
    ],
    donts: [
      "Logos that take up the top half of the page",
      "Mixing reimbursements with services on one line",
      "Vague descriptions ('consulting, week of X')",
      "Hidden fees in 8pt grey text",
    ],
    starterPrompt: "Invoice for $4,200 to Acme Corp from Brian Z, net 14, services May 1-31, ACH preferred",
    audience: "Freelancers, agencies, small business",
  },
  proposal: {
    type: "proposal",
    title: "How to write a proposal that closes",
    h1: "Write a proposal that closes",
    intro:
      "Proposals are sales documents disguised as documents. The buyer is comparing yours to two others. Win the first 15 seconds and you win the meeting after.",
    metaDesc:
      "How to write a proposal that closes the deal. Five-step structure, executive summary template, and printable samples to remix.",
    steps: [
      { name: "Open with the outcome they bought", text: "Page one isn't about you. It's a single line: 'We'll [outcome] by [date] for [price].' Three lines max. Then page break." },
      { name: "Executive summary on page 2", text: "Five bullets. What's the problem, what's the solution, what's the price, what's the timeline, what's the next step. Read in 90 seconds." },
      { name: "Scope before everything else", text: "Itemize deliverables. Use 'will deliver' / 'will not deliver' columns. Ambiguity at this stage = revision later." },
      { name: "Price tiers, not single price", text: "Three options. Anchor the middle. Let the buyer trade off scope vs price without going back to negotiate." },
      { name: "Make the signature easy", text: "Last page: signature line, printed name, date, accepted scope. Sign and email back — no DocuSign required for amounts under $25K." },
    ],
    dos: [
      "Cover page with project name, client name, your name, date",
      "Page numbers, table of contents on anything 4+ pages",
      "Include kill clauses (out clauses for both sides)",
      "State expiration: 'this quote is valid for 30 days'",
    ],
    donts: [
      "Boilerplate company history on page 1",
      "Single huge wall-of-text scope section",
      "Hidden line items below 'subtotal'",
      "'TBD' anywhere on the price page",
    ],
    starterPrompt: "Proposal for redesigning Acme's marketing site, $48K fixed, 8 weeks, three milestones",
    audience: "Agencies, consultants, freelancers, sales teams",
  },
  contract: {
    type: "contract",
    title: "How to write a contract anyone can sign",
    h1: "Write a contract anyone can sign",
    intro:
      "Plain-English contracts close faster than legalese. Lawyers can redline 8 pages in 20 minutes — they cannot un-confuse a small business owner.",
    metaDesc:
      "How to write a contract people actually read. Five-step structure, key clauses, and printable plain-English samples to remix.",
    steps: [
      { name: "Define both parties in line one", text: "'This agreement between [Company A] ('Client') and [Company B] ('Vendor') dated [Date]'. Done. No 'WHEREAS' needed for amounts under $100K." },
      { name: "Scope in numbered clauses", text: "Use 1.1 / 1.2 / 1.3. Lawyers and judges read this way. Mirrors your proposal section-for-section." },
      { name: "Payment terms in plain words", text: "'Client pays Vendor $X within 14 days of each milestone invoice.' Not 'remuneration shall be tendered'." },
      { name: "Termination clause both ways", text: "Either side can terminate with 14 days notice. Client pays for completed work. Vendor returns advance for work not done." },
      { name: "Sign and date in person or via PDF", text: "Two signature blocks. Print name, sign, date. PDF signatures via free tools are legally binding in all 50 states (E-SIGN Act, 2000)." },
    ],
    dos: [
      "State governing state law ('Delaware', 'California')",
      "Define IP ownership clearly (work-for-hire vs license)",
      "Include a force-majeure clause (post-2020 standard)",
      "Keep total length under 4 pages where possible",
    ],
    donts: [
      "Boilerplate copy-pasted from a 2014 web template",
      "Indemnification clauses that protect only one side",
      "Auto-renew terms hidden in section 11",
      "Mutual NDAs longer than the contract itself",
    ],
    starterPrompt: "Plain-English mutual NDA between two startups discussing a partnership, 2 pages max",
    audience: "Founders, freelancers, small business legal",
  },
  letter: {
    type: "letter",
    title: "How to write a professional letter",
    h1: "Write a professional letter",
    intro:
      "Formal letters still close jobs, settle disputes, and open doors. The format hasn't changed in 80 years for a reason — it works.",
    metaDesc:
      "How to write a professional letter that gets read. Five-step structure, opening lines, and printable samples for every use case.",
    steps: [
      { name: "Header before greeting", text: "Your name and address, top-left or centered. Date below. Recipient address below that. One blank line before 'Dear [Name],'." },
      { name: "First line earns the read", text: "Skip 'I hope this letter finds you well.' Open with what you want them to do or know. 'I'm writing to follow up on...'." },
      { name: "One paragraph per idea", text: "Three to five paragraphs. Two to four sentences each. Hard return between ideas. The eye needs anchors." },
      { name: "Sign off with the ask", text: "Close paragraph restates the request and gives a deadline. 'Please respond by Friday, June 14, so we can move forward.'" },
      { name: "Sign, print, send", text: "'Sincerely,' or 'Best regards,' — four blank lines for a wet signature — printed name. Title and company below if relevant." },
    ],
    dos: [
      "Use Times New Roman, Georgia, or Inter at 11-12pt",
      "1-inch margins on all four sides",
      "Single-space within paragraphs, double-space between",
      "Right-align the date if you're old-school; left-align if modern",
    ],
    donts: [
      "Emoji or exclamation marks in formal letters",
      "Reply-all'ing in business letters",
      "Mixed fonts or odd colors",
      "Going past two pages — split into two letters instead",
    ],
    starterPrompt: "Cover letter for a product designer applying to a Series A startup",
    audience: "Job seekers, legal correspondents, professionals",
  },
  deck: {
    type: "deck",
    title: "How to write a one-page deck",
    h1: "Write a one-page deck",
    intro:
      "One-page decks are how serious people pitch in 2026. Investors print them. Buyers skim them. Conference programmers read them on the train.",
    metaDesc:
      "How to write a one-page deck that pitches in 90 seconds. Five-section structure, layout tips, and printable samples to remix.",
    steps: [
      { name: "Headline, sub, and number", text: "Top of the page: the one-sentence pitch, a supporting line, and one stat the reader will repeat to their boss." },
      { name: "Three columns: problem, solution, proof", text: "Equal width. Headline + 2 lines each. Use a small graphic only if it carries weight — otherwise just type." },
      { name: "Team row near the bottom", text: "Four head photos OR four name+role lines. Investors and partners want to see who's behind it." },
      { name: "One CTA in the corner", text: "Bottom-right: contact email, calendar link, or 'Read full deck →'. One option only. Multiple CTAs = no action." },
      { name: "Print at 11x17 (tabloid) for impact", text: "Tabloid prints fold to letter — buyers can flip it open in a meeting. Web version stays as a single PNG/PDF for email." },
    ],
    dos: [
      "Use one accent color and one neutral",
      "Limit text to 80 words total across the page",
      "Include a real-world data point in the proof section",
      "Make the headline a claim, not a category",
    ],
    donts: [
      "12-slide decks pretending to be one-pagers",
      "Stock photos of generic teams in offices",
      "QR codes you didn't test on a real phone",
      "More than three fonts (use one + bold weights)",
    ],
    starterPrompt: "One-page deck for a B2B SaaS that turns customer support tickets into product roadmap items",
    audience: "Founders, product leads, agency partners",
  },
  report: {
    type: "report",
    title: "How to write a quarterly report",
    h1: "Write a quarterly report",
    intro:
      "Executives read the first paragraph and the last bullet. Everything in between is for the auditors. Write for both.",
    metaDesc:
      "How to write a quarterly report that gets read by the C-suite. Five-section structure, KPI tables, and printable samples.",
    steps: [
      { name: "Open with the headline number", text: "Revenue, retention, or shipping velocity — whichever your readers care most about. Bold, big, and on page 1." },
      { name: "Three wins, three losses, three asks", text: "Symmetrical bullets. Wins build credibility. Losses build trust. Asks are why the report exists." },
      { name: "KPI table mid-document", text: "Eight metrics maximum. Quarter-over-quarter delta. Color the delta cell green/red but keep the number black for printing." },
      { name: "One narrative per business area", text: "Sales, product, ops — one paragraph each. Not bullet lists. Tell the reader what happened and what it means." },
      { name: "Next quarter in one paragraph", text: "Three things you'll ship, two metrics you're betting on, one risk you're tracking. End on the risk." },
    ],
    dos: [
      "Date the report (Q2 2026, May 1 — Jul 31)",
      "Include a one-line TL;DR under the title",
      "Use the same KPI definitions every quarter",
      "Cite sources (CRM, finance, analytics) in footnotes",
    ],
    donts: [
      "Vanity metrics (registered users without DAU)",
      "Comparing this quarter only to last quarter (always YoY too)",
      "Hiding the bad news on page 8",
      "Charts that don't have axes labeled",
    ],
    starterPrompt: "Q2 2026 business report with KPIs, three wins, three losses, and next-quarter plan",
    audience: "Executives, board members, finance teams",
  },
  brief: {
    type: "brief",
    title: "How to write a creative brief",
    h1: "Write a creative brief",
    intro:
      "Creative briefs are contracts in disguise. Vague briefs produce vague work. Sharp briefs produce sharp work — and shorter timelines.",
    metaDesc:
      "How to write a creative brief that produces sharp work. Five-section structure, audience definition, and printable samples.",
    steps: [
      { name: "Objective in one sentence", text: "'Increase trial signups 30% by end of Q3.' Not 'rebrand for the modern era'. Measurable, time-bound." },
      { name: "Audience in concrete people", text: "Name a real persona ('Sara, 34, marketing director at a 50-person SaaS'). Stock segments ('Gen Z professionals') = bad work." },
      { name: "Key message, one line", text: "Pretend the audience can only remember one sentence. What is it? If you can't write it, the campaign is unfocused." },
      { name: "Mandatories (and forbiddens)", text: "Brand colors, logo placement, legal lines, banned phrases. Save 3 rounds of revision by stating these up front." },
      { name: "Deliverables and dates", text: "List every asset (hero image, 3 social variants, video cut). Each with a due date. No 'TBD' or 'see Slack'." },
    ],
    dos: [
      "Include a single competitive reference (good or bad)",
      "Define tone with three adjectives, not five",
      "Attach 3-5 example assets you love",
      "Name a single point of contact (one approver)",
    ],
    donts: [
      "Asking for 'something fun and edgy but also corporate'",
      "Mid-project scope changes without a new brief",
      "Skipping the audience section",
      "Approval-by-committee chains",
    ],
    starterPrompt: "Creative brief for a 6-week brand refresh campaign targeting B2B marketing directors",
    audience: "Marketers, agencies, in-house creatives",
  },
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

export default function Templates() {
  const { type = "" } = useParams<{ type: string }>();
  const normalized = type.toLowerCase();
  const navigate = useNavigate();
  const api = useApi();
  const guide = GUIDES[normalized];

  useDocumentTitle(guide ? `${guide.title} — Megabyte PDF` : "Template not found");

  const [projects, setProjects] = useState<PublicProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guide) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sort: "trending", limit: "6", tag: normalized });
        const res = await api<{ projects: PublicProjectSummary[] }>(
          `/api/explore?${params.toString()}`
        );
        setProjects(res.projects);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, guide, normalized]);

  useEffect(() => {
    captureEvent("templates_view", { type: normalized, valid: Boolean(guide) });
  }, [normalized, guide]);

  useEffect(() => {
    if (!guide) return;
    const origin = window.location.origin;
    const url = `${origin}/templates/${normalized}`;

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

    setMeta('meta[name="description"]', "content", guide.metaDesc);
    setMeta('meta[property="og:title"]', "content", guide.title);
    setMeta('meta[property="og:description"]', "content", guide.metaDesc);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[name="twitter:title"]', "content", guide.title);
    setMeta('meta[name="twitter:description"]', "content", guide.metaDesc);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setLink("canonical", url);

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "HowTo",
          "@id": url,
          name: guide.title,
          description: guide.metaDesc,
          totalTime: "PT15M",
          step: guide.steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.name,
            text: s.text,
          })),
        },
        {
          "@type": "Article",
          headline: guide.title,
          description: guide.metaDesc,
          author: { "@type": "Organization", name: "Megabyte PDF" },
          publisher: { "@type": "Organization", name: "Megabyte PDF" },
          datePublished: "2026-05-11",
          mainEntityOfPage: url,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            {
              "@type": "ListItem",
              position: 2,
              name: "Templates",
              item: `${origin}/templates`,
            },
            { "@type": "ListItem", position: 3, name: guide.h1, item: url },
          ],
        },
      ],
    };
    let ld = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]#templates-jsonld'
    );
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "templates-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, [guide, normalized]);

  if (!guide) {
    const list = Object.values(GUIDES);
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How-to guides for every document
          </h1>
          <p className="text-[var(--color-muted)] mb-10 max-w-2xl">
            Pick a document type. Get the structure, the do's and don'ts, and a starter prompt
            you can paste into the editor.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((g) => (
              <Link
                key={g.type}
                to={`/templates/${g.type}`}
                className="card p-5 text-left hover:border-[var(--color-cyan)]/60 transition-all"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-2">
                  <BookOpen size={12} />
                  <span>{g.type}</span>
                </div>
                <h2 className="font-semibold mb-1">{g.h1}</h2>
                <p className="text-xs text-[var(--color-muted)] line-clamp-2">{g.intro}</p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">
        <section className="border-b border-[var(--color-line)] bg-gradient-to-b from-[var(--color-cyan)]/[0.04] to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-1.5">
              <Link to="/" className="hover:text-[var(--color-fg)]">Home</Link>
              <span className="opacity-50">/</span>
              <Link to="/templates" className="hover:text-[var(--color-fg)]">Templates</Link>
              <span className="opacity-50">/</span>
              <span className="text-[var(--color-fg)]">{guide.h1}</span>
            </nav>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-4">
              <BookOpen size={12} />
              <span>Guide · {guide.type}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">{guide.h1}</h1>
            <p className="text-[var(--color-muted)] text-base sm:text-lg max-w-2xl mb-6">
              {guide.intro}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  captureEvent("templates_starter_click", { type: normalized });
                  navigate(`/dashboard?prompt=${encodeURIComponent(guide.starterPrompt)}`);
                }}
                className="btn btn-primary text-sm"
              >
                <Sparkles size={14} /> Try this prompt
              </button>
              <Link to={`/t/${normalized}`} className="btn btn-ghost text-sm">
                Browse {guide.type} PDFs <ArrowRight size={14} />
              </Link>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-3">For: {guide.audience}</p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-6">
            The five steps
          </h2>
          <ol className="space-y-6 mb-12">
            {guide.steps.map((s, i) => (
              <li key={s.name} className="flex gap-4">
                <span className="size-8 shrink-0 rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] grid place-items-center text-sm font-semibold tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold mb-1.5">{s.name}</h3>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-3 text-green-400 flex items-center gap-2">
                <Check size={14} /> Do
              </h3>
              <ul className="space-y-2 text-sm text-[var(--color-fg)]/85">
                {guide.dos.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">·</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-3 text-red-400 flex items-center gap-2">
                <X size={14} /> Don't
              </h3>
              <ul className="space-y-2 text-sm text-[var(--color-fg)]/85">
                {guide.donts.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">·</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-[var(--color-cyan)]/[0.06] to-[var(--color-violet)]/[0.04] mb-12">
            <h3 className="font-semibold mb-2">Starter prompt</h3>
            <p className="text-sm text-[var(--color-muted)] mb-3 italic">"{guide.starterPrompt}"</p>
            <button
              onClick={() => {
                captureEvent("templates_starter_click", { type: normalized });
                navigate(`/dashboard?prompt=${encodeURIComponent(guide.starterPrompt)}`);
              }}
              className="btn btn-primary text-xs"
            >
              <Sparkles size={12} /> Use this prompt
            </button>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold">
              Samples from the community
            </h2>
            <Link to={`/t/${normalized}`} className="text-xs text-[var(--color-cyan)] hover:underline">
              See all →
            </Link>
          </div>
          {error && (
            <div role="alert" className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-3">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[var(--color-cyan)]" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-8">
              No public {normalized} PDFs yet. Make the first one →{" "}
              <Link to="/dashboard" className="text-[var(--color-cyan)] hover:underline">
                Dashboard
              </Link>
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/c/${p.slug}`}
                  className="card text-left p-0 overflow-hidden group hover:border-[var(--color-cyan)]/60 transition-all"
                  style={{ minHeight: 180 }}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-[var(--color-card)] to-black/40 border-b border-[var(--color-line)] grid place-items-center">
                    <div className="text-4xl opacity-20 font-bold tracking-tighter">PDF</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-[var(--color-cyan)]">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
                      {p.author?.name && <span className="truncate">by {p.author.name}</span>}
                      <span className="opacity-40">·</span>
                      <span>{fmtRelative(p.updatedAt)}</span>
                      {p.viewCount > 0 && (
                        <>
                          <span className="opacity-40">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Eye size={10} /> {p.viewCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-[var(--color-line)] bg-[var(--color-bg-elev)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to write yours?
            </h2>
            <p className="text-[var(--color-muted)] mb-6">
              Paste the starter prompt and ship a finished PDF in two minutes.
            </p>
            <Link to="/dashboard" className="btn btn-primary text-sm">
              Open the editor <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-4">
            More guides
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.values(GUIDES)
              .filter((g) => g.type !== normalized)
              .map((g) => (
                <Link
                  key={g.type}
                  to={`/templates/${g.type}`}
                  className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-line)] hover:border-[var(--color-cyan)]/60 hover:text-[var(--color-cyan)] transition-colors"
                >
                  {g.h1}
                </Link>
              ))}
          </div>
          <div className="mt-6">
            <Link
              to="/templates"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)] inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} /> All templates index
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
