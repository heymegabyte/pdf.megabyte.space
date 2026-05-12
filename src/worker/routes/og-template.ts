import { Hono } from "hono";
import puppeteer from "@cloudflare/puppeteer";
import * as Sentry from "@sentry/cloudflare";
import type { Env } from "../types";

// Slug → minimal OG fields. Mirrors src/web/data/templates-hub.ts.
// Auto-extracted on 2026-05-11. Keep in sync if templates change.
const TEMPLATE_OG: Record<string, { h1: string; glyph: string; g1: string; g2: string }> = {
  invoice: { h1: "Invoices that get paid in 14 days", glyph: "💸", g1: "#00E5FF", g2: "#7C3AED" },
  estimate: { h1: "Estimates that close on the first read", glyph: "📐", g1: "#50AAE3", g2: "#00E5FF" },
  "purchase-order": { h1: "Purchase orders the accounting team accepts", glyph: "📦", g1: "#7C3AED", g2: "#F472B6" },
  "statement-of-work": { h1: "SOWs that prevent scope creep", glyph: "📋", g1: "#00E5FF", g2: "#34D399" },
  nda: { h1: "NDAs in plain English that still hold up", glyph: "🔒", g1: "#060610", g2: "#7C3AED" },
  "service-agreement": { h1: "Service agreements without 40-page boilerplate", glyph: "🤝", g1: "#7C3AED", g2: "#50AAE3" },
  "consulting-proposal": { h1: "Consulting proposals that close on read 1", glyph: "🎯", g1: "#00E5FF", g2: "#F472B6" },
  "business-plan": { h1: "Business plans investors actually read", glyph: "📊", g1: "#7C3AED", g2: "#34D399" },
  "pitch-deck": { h1: "Ten-slide pitch decks investors keep", glyph: "🚀", g1: "#00E5FF", g2: "#7C3AED" },
  "executive-summary": { h1: "One-page summaries that get the meeting", glyph: "📝", g1: "#50AAE3", g2: "#7C3AED" },
  "resume-software-engineer": { h1: "Software engineer resumes recruiters open", glyph: "👨‍💻", g1: "#00E5FF", g2: "#50AAE3" },
  "resume-designer": { h1: "Designer resumes that earn the portfolio click", glyph: "🎨", g1: "#F472B6", g2: "#7C3AED" },
  "resume-marketing-manager": { h1: "Marketing manager resumes hiring managers save", glyph: "📈", g1: "#34D399", g2: "#50AAE3" },
  "cover-letter": { h1: "Cover letters that don't read like cover letters", glyph: "✉️", g1: "#00E5FF", g2: "#34D399" },
  "cv-academic": { h1: "Academic CVs that read like a publication", glyph: "🎓", g1: "#7C3AED", g2: "#060610" },
  "portfolio-cover": { h1: "Portfolio cover sheets that earn the next page", glyph: "📂", g1: "#F472B6", g2: "#00E5FF" },
  "recommendation-letter": { h1: "Recommendation letters that actually help", glyph: "💌", g1: "#34D399", g2: "#F472B6" },
  "demand-letter": { h1: "Demand letters that get the money back", glyph: "⚖️", g1: "#060610", g2: "#F472B6" },
  "employment-verification": { h1: "Employment letters HR sends in 30 seconds", glyph: "🪪", g1: "#50AAE3", g2: "#34D399" },
  "thank-you-note": { h1: "Thank-you notes that get the offer", glyph: "🙏", g1: "#00E5FF", g2: "#F472B6" },
  syllabus: { h1: "Syllabi students actually open all semester", glyph: "📚", g1: "#7C3AED", g2: "#00E5FF" },
  "lesson-plan": { h1: "Lesson plans you can teach off the page", glyph: "✏️", g1: "#34D399", g2: "#F472B6" },
  "quiz-template": { h1: "Quizzes you can print and grade in 5 minutes", glyph: "❓", g1: "#00E5FF", g2: "#7C3AED" },
  "study-guide": { h1: "Study guides that make the night-before review work", glyph: "🗂️", g1: "#50AAE3", g2: "#34D399" },
  "book-report": { h1: "Book reports that read like real reviews", glyph: "📖", g1: "#F472B6", g2: "#50AAE3" },
  "thesis-proposal": { h1: "Thesis proposals committees actually approve", glyph: "🔬", g1: "#7C3AED", g2: "#34D399" },
  "reading-list": { h1: "Reading lists worth posting on the wall", glyph: "📑", g1: "#00E5FF", g2: "#34D399" },
  "field-trip-permission": { h1: "Permission slips parents actually return", glyph: "🚌", g1: "#34D399", g2: "#00E5FF" },
  "wedding-invitation": { h1: "Wedding invitations from a sentence", glyph: "💍", g1: "#F472B6", g2: "#FACC15" },
  "baby-shower-invite": { h1: "Baby shower invitations that feel like a hug", glyph: "🍼", g1: "#FACC15", g2: "#34D399" },
  "birthday-flyer": { h1: "Birthday flyers that get kids excited", glyph: "🎂", g1: "#F472B6", g2: "#00E5FF" },
  "event-program": { h1: "Event programs guests keep as a souvenir", glyph: "🎟️", g1: "#7C3AED", g2: "#FACC15" },
  "concert-poster": { h1: "Concert posters that stay on the wall after the show", glyph: "🎸", g1: "#060610", g2: "#F472B6" },
  "conference-agenda": { h1: "Conference agendas attendees actually open", glyph: "📅", g1: "#50AAE3", g2: "#7C3AED" },
  "workshop-handout": { h1: "Workshop handouts attendees use Monday morning", glyph: "🧩", g1: "#34D399", g2: "#7C3AED" },
  "menu-card": { h1: "Menus that sell the dish before the first bite", glyph: "🍽️", g1: "#FACC15", g2: "#F472B6" },
  "one-pager": { h1: "Product one-pagers reps actually use", glyph: "📄", g1: "#00E5FF", g2: "#7C3AED" },
  "sales-sheet": { h1: "Sales sheets that walk into the meeting first", glyph: "📑", g1: "#7C3AED", g2: "#34D399" },
  "press-release": { h1: "Press releases reporters keep open", glyph: "📰", g1: "#060610", g2: "#50AAE3" },
  "case-study": { h1: "Case studies that close the next deal", glyph: "🏆", g1: "#34D399", g2: "#FACC15" },
  newsletter: { h1: "Newsletters people actually open", glyph: "✉️", g1: "#00E5FF", g2: "#FACC15" },
  "white-paper": { h1: "White papers that build authority", glyph: "📕", g1: "#7C3AED", g2: "#060610" },
  "brand-guidelines": { h1: "Brand guidelines vendors ask for first", glyph: "🎨", g1: "#F472B6", g2: "#00E5FF" },
  "recipe-card": { h1: "Recipe cards friends actually save", glyph: "👩‍🍳", g1: "#FACC15", g2: "#34D399" },
  "workout-plan": { h1: "Workout plans that survive the gym bag", glyph: "💪", g1: "#00E5FF", g2: "#34D399" },
  "meal-plan": { h1: "Meal plans that make the shopping list itself", glyph: "🥗", g1: "#34D399", g2: "#FACC15" },
  "travel-itinerary": { h1: "Itineraries that fold into a passport", glyph: "✈️", g1: "#50AAE3", g2: "#FACC15" },
  "budget-tracker": { h1: "Budgets you'll actually fill in", glyph: "💰", g1: "#34D399", g2: "#50AAE3" },
  "gift-certificate": { h1: "Gift certificates that feel like gifts", glyph: "🎁", g1: "#F472B6", g2: "#FACC15" },
  "thank-you-card": { h1: "Thank-you cards that beat the Venmo emoji", glyph: "💌", g1: "#FACC15", g2: "#F472B6" },
};

const BLOG_OG: Record<string, { h1: string; glyph: string; g1: string; g2: string }> = {
  "claude-code-pdf-design-system": { h1: "How Claude writes a cinematic PDF", glyph: "🎬", g1: "#00E5FF", g2: "#7C3AED" },
  "prompt-to-pdf-in-30-seconds": { h1: "Prompt → PDF in 30 seconds", glyph: "⚡", g1: "#FACC15", g2: "#00E5FF" },
  "why-pdf-still-wins-2026": { h1: "Why the PDF still wins in 2026", glyph: "📄", g1: "#50AAE3", g2: "#7C3AED" },
  "5-rules-for-an-invoice-that-gets-paid": { h1: "5 rules for an invoice that gets paid", glyph: "💸", g1: "#22C55E", g2: "#00E5FF" },
  "resume-template-that-beats-7-second-scan": { h1: "Resume template that beats the 7-second scan", glyph: "📑", g1: "#7C3AED", g2: "#F472B6" },
  "ai-pdf-generator-honest-comparison": { h1: "Honest AI PDF generator comparison, 2026", glyph: "🤖", g1: "#00E5FF", g2: "#22C55E" },
  "free-invoice-generator": { h1: "Free invoice generator", glyph: "💸", g1: "#22C55E", g2: "#00E5FF" },
  "free-resume-pdf": { h1: "Free resume PDF maker", glyph: "📑", g1: "#7C3AED", g2: "#F472B6" },
  "pdf-from-prompt": { h1: "PDF from a prompt", glyph: "✨", g1: "#FACC15", g2: "#00E5FF" },
};

const escapeSvg = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const wrapLines = (text: string, maxChars: number, maxLines: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (lines.length >= maxLines) break;
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
};

const buildOgSvg = (meta: { h1: string; glyph: string; g1: string; g2: string }, eyebrow: string): string => {
  const W = 1200;
  const H = 630;
  const pad = 72;
  const titleLines = wrapLines(meta.h1, 26, 3);
  const titleSize = 76;
  const lineH = titleSize * 1.15;
  const titleStartY = 260;

  const titleTspans = titleLines
    .map(
      (ln, i) =>
        `<tspan x="${pad}" y="${titleStartY + i * lineH}">${escapeSvg(ln)}</tspan>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeSvg(meta.h1)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0613"/>
      <stop offset="100%" stop-color="#060610"/>
    </linearGradient>
    <radialGradient id="g1" cx="0.12" cy="0.08" r="0.65">
      <stop offset="0%" stop-color="${meta.g1}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${meta.g1}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="0.88" cy="0.92" r="0.7">
      <stop offset="0%" stop-color="${meta.g2}" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="${meta.g2}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0 L0 0 0 48" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <g transform="translate(${pad} ${pad})">
    <circle cx="22" cy="22" r="22" fill="${meta.g1}"/>
    <text x="22" y="34" font-size="28" font-weight="900" fill="#060610" font-family="Inter, system-ui, sans-serif" text-anchor="middle">M</text>
    <text x="64" y="20" font-size="20" font-weight="700" fill="#ffffff" font-family="Inter, system-ui, sans-serif" letter-spacing="0.4">Megabyte PDF</text>
    <text x="64" y="42" font-size="12" font-weight="600" fill="${meta.g1}" font-family="Inter, system-ui, sans-serif" letter-spacing="3">${escapeSvg(eyebrow.toUpperCase())}</text>
  </g>
  <text x="${W - pad}" y="${pad + 28}" font-size="${110}" text-anchor="end" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji">${escapeSvg(meta.glyph)}</text>
  <text font-size="${titleSize}" font-weight="800" fill="#ffffff" font-family="Inter, system-ui, sans-serif" letter-spacing="-2">${titleTspans}</text>
  <line x1="${pad}" y1="${H - 110}" x2="${W - pad}" y2="${H - 110}" stroke="rgba(255,255,255,0.1)"/>
  <text x="${pad}" y="${H - 70}" font-size="22" font-weight="500" fill="#9CA0B0" font-family="Inter, system-ui, sans-serif">Type a prompt · Claude writes the document · Export the PDF</text>
  <g transform="translate(${pad} ${H - 50})">
    <rect width="156" height="34" rx="17" fill="rgba(0,229,255,0.12)" stroke="${meta.g1}" stroke-opacity="0.45"/>
    <text x="78" y="22" font-size="14" font-weight="700" fill="${meta.g1}" font-family="Inter, system-ui, sans-serif" text-anchor="middle" letter-spacing="0.6">pdf.megabyte.space</text>
  </g>
</svg>`;
};

const SVG_HEADERS = {
  "content-type": "image/svg+xml; charset=utf-8",
  "cache-control": "public, max-age=86400, s-maxage=2592000, immutable",
  "x-content-type-options": "nosniff",
};

const PNG_HEADERS = {
  "content-type": "image/png",
  "cache-control": "public, max-age=86400, s-maxage=2592000, immutable",
  "x-content-type-options": "nosniff",
};

async function renderPng(c: any, svg: string, cacheKey: string, slug: string, kind: string): Promise<Response> {
  const cached = await c.env.CACHE.get(cacheKey, "arrayBuffer");
  if (cached) {
    return new Response(cached, {
      headers: { ...PNG_HEADERS, "x-cache": "HIT" },
    });
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#0a0613;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`;

  Sentry.addBreadcrumb({
    category: "og",
    message: "puppeteer.screenshot",
    data: { slug, kind },
    level: "info",
  });

  let png: Uint8Array;
  const browser = await puppeteer.launch(c.env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    png = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 1200, height: 630 },
      omitBackground: false,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "og", step: "render", kind } });
    await browser.close();
    return c.redirect(`/og/${kind}/${slug}.svg`, 302);
  }
  await browser.close();

  c.executionCtx?.waitUntil(
    c.env.CACHE.put(cacheKey, png, { expirationTtl: 60 * 60 * 24 * 30 })
  );

  return new Response(png as BodyInit, {
    headers: { ...PNG_HEADERS, "x-cache": "MISS" },
  });
}

export const ogRoutes = new Hono<{ Bindings: Env }>();

ogRoutes.get("/template/:slug", async (c) => {
  const rawSlug = c.req.param("slug");
  if (!rawSlug) return c.text("Not found", 404);
  const wantsPng = rawSlug.endsWith(".png");
  const slug = rawSlug.replace(/\.(svg|png)$/, "");
  const meta = TEMPLATE_OG[slug];
  if (!meta) return c.text("Not found", 404);
  const svg = buildOgSvg(meta, "Template");
  if (wantsPng) {
    return renderPng(c, svg, `og:tpl:v1:${slug}`, slug, "template");
  }
  return c.body(svg, 200, SVG_HEADERS);
});

ogRoutes.get("/blog/:slug", async (c) => {
  const rawSlug = c.req.param("slug");
  if (!rawSlug) return c.text("Not found", 404);
  const wantsPng = rawSlug.endsWith(".png");
  const slug = rawSlug.replace(/\.(svg|png)$/, "");
  const meta = BLOG_OG[slug];
  if (!meta) return c.text("Not found", 404);
  const svg = buildOgSvg(meta, "Article");
  if (wantsPng) {
    return renderPng(c, svg, `og:blog:v1:${slug}`, slug, "blog");
  }
  return c.body(svg, 200, SVG_HEADERS);
});
