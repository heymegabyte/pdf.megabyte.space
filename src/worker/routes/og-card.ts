/**
 * SVG OG-card renderer for public community PDFs.
 *
 * Mounted under `/api/og/:slug`. Returns a hand-rolled SVG (no external
 * fonts, no remote assets) so social-media crawlers can fetch it without
 * tripping our CSP and without burning Puppeteer minutes.
 *
 * For the PNG variant (used by RSS / og:image), see `routes/og-template.ts`.
 */
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Env, Variables } from "../types";
import { svgEscape, wrapWords } from "../lib/xml-utils";

const ogCard = new Hono<{ Bindings: Env; Variables: Variables }>();

ogCard.get("/:slug", async (c) => {
  const db = getDb(c.env.DB);
  const slug = c.req.param("slug");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!project) return c.text("Not found", 404);

  const author = await db.query.users.findFirst({
    where: eq(schema.users.id, project.userId),
  });
  const tags = project.tags
    ? project.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4)
    : [];
  const titleLines = wrapWords(project.title || "Untitled PDF", 28, 3);
  const authorName = author?.name ?? "Megabyte PDF";

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${230 + i * 88}" font-size="76" font-weight="800" fill="#ffffff" font-family="Inter, system-ui, sans-serif" letter-spacing="-2">${svgEscape(line)}</text>`
    )
    .join("");
  const tagSvg = tags
    .map(
      (t, i) =>
        `<g transform="translate(${80 + i * 150}, 510)"><rect width="135" height="42" rx="21" fill="rgba(0,229,255,0.12)" stroke="#00E5FF" stroke-opacity="0.4"/><text x="67.5" y="27" font-size="18" font-weight="600" fill="#00E5FF" font-family="Inter, system-ui, sans-serif" text-anchor="middle">${svgEscape(t)}</text></g>`
    )
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#060610"/>
      <stop offset="1" stop-color="#0a0a18"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.5">
      <stop offset="0" stop-color="#00E5FF" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#00E5FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(80, 100)">
    <rect width="58" height="58" rx="14" fill="#00E5FF"/>
    <text x="29" y="40" font-size="32" font-weight="900" fill="#060610" font-family="Inter, system-ui, sans-serif" text-anchor="middle">M</text>
  </g>
  <text x="156" y="135" font-size="22" font-weight="700" fill="#ffffff" font-family="Inter, system-ui, sans-serif" letter-spacing="0.5">Megabyte PDF</text>
  <text x="156" y="160" font-size="14" font-weight="500" fill="#7C8090" font-family="Inter, system-ui, sans-serif" letter-spacing="2" text-transform="uppercase">COMMUNITY</text>
  ${titleSvg}
  ${tagSvg}
  <line x1="80" y1="582" x2="1120" y2="582" stroke="#1f1f2e" stroke-width="1"/>
  <text x="80" y="556" font-size="18" font-weight="500" fill="#9ca0b0" font-family="Inter, system-ui, sans-serif">by ${svgEscape(authorName)}</text>
  <text x="1120" y="556" font-size="18" font-weight="600" fill="#00E5FF" font-family="Inter, system-ui, sans-serif" text-anchor="end">pdf.megabyte.space/c/${svgEscape(slug)}</text>
</svg>`;

  return c.body(svg, 200, {
    "content-type": "image/svg+xml; charset=utf-8",
    "cache-control": "public, max-age=600, s-maxage=3600",
  });
});

export default ogCard;
