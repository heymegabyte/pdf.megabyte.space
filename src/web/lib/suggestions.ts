// Lightweight client-side "next-prompt" suggester. No AI round-trip — heuristic on
// current HTML + project state. Surfaces three context-aware chips that nudge
// the user toward their next high-leverage edit.

type Suggestion = { id: string; label: string; prompt: string };

const HAS_PRINT = /class="?(page|doc|flyer)/i;
const HAS_TOC = /table of contents|toc\b/i;
const HAS_COVER = /<h1[^>]*>[^<]{4,}.*?<\/h1>/i;
const HAS_FOOTER = /<footer|\bfooter\b/i;
const HAS_LOGO = /logo|<img[^>]+alt="?logo/i;
const HAS_SIGNATURE = /signature|signed by/i;
const HAS_DATE = /\b(20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
const HAS_TABLE = /<table/i;
const HAS_CHART = /chart|svg|<canvas/i;

export function suggestNext(html: string, isPublic: boolean, turnCount: number): Suggestion[] {
  const out: Suggestion[] = [];
  const has = (re: RegExp) => re.test(html);

  if (turnCount === 0) {
    out.push(
      { id: "title", label: "Make the title bolder", prompt: "Make the title larger and bolder, with stronger color contrast." },
      { id: "cover", label: "Add a cover page", prompt: "Add a beautiful cover page with the title, subtitle, and today's date." },
      { id: "polish", label: "Improve typography", prompt: "Tighten typography — better hierarchy, comfortable line-height, balanced spacing." },
    );
    return out.slice(0, 3);
  }

  if (!has(HAS_COVER)) out.push({ id: "cover", label: "Add a cover page", prompt: "Add a polished cover page with the title, subtitle, and date." });
  if (!has(HAS_TOC) && (html.match(/<h2/gi)?.length ?? 0) >= 3)
    out.push({ id: "toc", label: "Add table of contents", prompt: "Add a table of contents page that lists every H2 with page numbers." });
  if (!has(HAS_FOOTER)) out.push({ id: "footer", label: "Add a footer", prompt: "Add a footer with the document title on the left and page number on the right." });
  if (!has(HAS_LOGO)) out.push({ id: "logo", label: "Add a logo placeholder", prompt: "Add a logo placeholder block in the top-left, 64×64, with rounded corners." });
  if (!has(HAS_SIGNATURE)) out.push({ id: "sig", label: "Add signature block", prompt: "Add a signature block at the end with name, title, date." });
  if (!has(HAS_DATE)) out.push({ id: "date", label: "Insert today's date", prompt: "Insert today's date in the header, right-aligned." });
  if (!has(HAS_TABLE)) out.push({ id: "table", label: "Add a comparison table", prompt: "Add a 3-column comparison table with clean borders and zebra stripes." });
  if (!has(HAS_CHART)) out.push({ id: "chart", label: "Add an SVG chart", prompt: "Add a simple SVG bar chart with 4 bars and value labels." });
  if (!has(HAS_PRINT)) out.push({ id: "print", label: "Optimize for print", prompt: "Optimize for print: 8.5×11 page size, 0.75in margins, page breaks between sections." });

  // Always include a high-impact polish line
  out.push({ id: "color", label: "Refine color palette", prompt: "Refine the color palette — pick a tasteful 3-color scheme and apply it consistently." });
  out.push({ id: "spacing", label: "Tighten spacing", prompt: "Tighten section spacing — reduce padding by ~20% and align baselines." });

  if (isPublic) {
    out.push({ id: "share", label: "Polish for sharing", prompt: "This will be shared publicly — polish typography, fix any awkward line breaks, balance the layout." });
  }

  return out.slice(0, 3);
}
