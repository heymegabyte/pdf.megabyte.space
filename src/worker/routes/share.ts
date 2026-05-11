import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import puppeteer from "@cloudflare/puppeteer";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import { buildSharePreviewDoc, wrapDocument, pageDimensionsIn } from "../lib/templates";
import { sendEmail } from "../lib/emails";
import type { Env, Variables } from "../types";

const TRENDING_MILESTONES = [100, 1000, 10000] as const;
const MILESTONE_LABELS: Record<number, string> = { 100: "100", 1000: "1,000", 10000: "10,000" };

async function maybeFireTrendingMilestone(
  env: Env,
  projectId: string,
  slug: string,
  nextViews: number
): Promise<void> {
  const hit = TRENDING_MILESTONES.find((m) => nextViews === m);
  if (!hit) return;
  const db = getDb(env.DB);
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
  if (!project) return;
  try {
    await db.insert(schema.projectMilestones).values({
      id: `mst_${nanoid(10)}`,
      projectId,
      milestone: hit,
    });
  } catch {
    return; // UNIQUE collision = already fired
  }
  await sendEmail(env, {
    userId: project.userId,
    template: "trending-milestone",
    dedupKey: `trending:${projectId}:${hit}`,
    data: {
      project_title: project.title,
      milestone_label: MILESTONE_LABELS[hit],
      view_count: nextViews,
      rank: 1,
      og_image_url: project.isPublic && project.slug
        ? `${env.APP_URL}/s/og/${project.slug}.png`
        : `${env.APP_URL}/og.jpg`,
      share_url: `${env.APP_URL}/s/${slug}`,
      tweet_url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `${project.title} just crossed ${MILESTONE_LABELS[hit]} views on @megabytepdf`
      )}&url=${encodeURIComponent(`${env.APP_URL}/s/${slug}`)}`,
    },
  });
}

export const shareApi = new Hono<{ Bindings: Env; Variables: Variables }>();

shareApi.post("/projects/:id/share", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const rateKey = `ratelimit:share:${userId}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= 20) {
    return c.json({ error: "Slow down — too many share links created today.", code: "RATE_LIMIT" }, 429);
  }
  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 24 });

  const slug = nanoid(10);
  await db.insert(schema.shareLinks).values({ slug, projectId: id });
  return c.json({ slug, url: `${c.env.APP_URL}/s/${slug}` }, 201);
});

shareApi.delete("/projects/:id/share/:slug", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const slug = c.req.param("slug");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  await db
    .delete(schema.shareLinks)
    .where(and(eq(schema.shareLinks.slug, slug), eq(schema.shareLinks.projectId, id)));
  return c.json({ ok: true });
});

export const sharePublic = new Hono<{ Bindings: Env }>();

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BRAND_GRADIENTS: { from: string; to: string; accent: string }[] = [
  { from: "#1a0b2e", to: "#060610", accent: "#7C3AED" },
  { from: "#072a36", to: "#060610", accent: "#00E5FF" },
  { from: "#1a0f2e", to: "#0a0613", accent: "#50AAE3" },
  { from: "#062834", to: "#0a0613", accent: "#7C3AED" },
  { from: "#23072c", to: "#0a0c1b", accent: "#00E5FF" },
];

const hashSlug = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
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
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = (lines[maxLines - 1] ?? "").replace(/.{1,3}$/, "…");
  }
  return lines;
};

type BrandSvgOpts = {
  slug: string;
  title: string;
  tags: string[];
  pageSize: string;
  width: number;
  height: number;
};

const buildBrandSvg = ({ slug, title, tags, pageSize, width, height }: BrandSvgOpts): string => {
  const palette = BRAND_GRADIENTS[hashSlug(slug) % BRAND_GRADIENTS.length]!;
  const pad = Math.round(width * 0.06);
  const titleFontSize = Math.round(width * 0.055);
  const lineHeight = Math.round(titleFontSize * 1.27);
  const maxCharsPerLine = Math.max(14, Math.round(width / (titleFontSize * 0.52)));
  const titleLines = wrapLines(title, maxCharsPerLine, 3);
  const wordmarkFontSize = Math.round(width * 0.0175);
  const tagFontSize = Math.round(width * 0.0163);
  const tagW = Math.round(width * 0.14);
  const tagH = Math.round(height * 0.053);
  const tagGap = Math.round(width * 0.015);
  const tagBaselineY = height - Math.round(height * 0.2);
  const wordmarkY = pad;
  const titleBlockTopY = pad + Math.round(height * 0.18);
  const titleBaselineY = titleBlockTopY + titleFontSize;
  const footerLineY = height - Math.round(height * 0.1);
  const footerTextY = height - Math.round(height * 0.047);
  const badgeW = Math.round(width * 0.07);
  const badgeH = Math.round(height * 0.047);
  const badgeFontSize = Math.round(width * 0.0138);

  const titleTspans = titleLines
    .map((ln, i) => `<tspan x="${pad}" y="${titleBaselineY + i * lineHeight}">${escapeSvg(ln)}</tspan>`)
    .join("");

  const tagChips = tags
    .map((t, i) => {
      const x = pad + i * (tagW + tagGap);
      return `<g transform="translate(${x} ${tagBaselineY})">
  <rect width="${tagW}" height="${tagH}" rx="${Math.round(tagH / 2)}" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
  <text x="${tagW / 2}" y="${Math.round(tagH * 0.65)}" text-anchor="middle" font-size="${tagFontSize}" fill="rgba(255,255,255,0.7)" font-family="ui-sans-serif,system-ui,sans-serif">${escapeSvg(t.slice(0, 14))}</text>
</g>`;
    })
    .join("\n");

  const dotR = Math.round(width * 0.0175);
  const wordmarkTextX = pad + dotR * 2 + Math.round(width * 0.012);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeSvg(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.from}" />
      <stop offset="100%" stop-color="${palette.to}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.7">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.28" />
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />
  <g transform="translate(${pad} ${wordmarkY})">
    <circle cx="${dotR}" cy="${dotR}" r="${dotR}" fill="${palette.accent}" />
    <text x="${wordmarkTextX - pad}" y="${dotR + Math.round(wordmarkFontSize * 0.4)}" font-size="${wordmarkFontSize}" font-weight="600" fill="rgba(255,255,255,0.85)" font-family="ui-sans-serif,system-ui,sans-serif" letter-spacing="0.08em">MEGABYTE PDF</text>
  </g>
  <g transform="translate(${width - pad - badgeW} ${wordmarkY})">
    <rect width="${badgeW}" height="${badgeH}" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" />
    <text x="${badgeW / 2}" y="${Math.round(badgeH * 0.65)}" text-anchor="middle" font-size="${badgeFontSize}" fill="rgba(255,255,255,0.85)" font-family="ui-monospace,SF Mono,monospace" letter-spacing="0.05em">${escapeSvg(pageSize)}</text>
  </g>
  <text font-size="${titleFontSize}" font-weight="700" fill="#f4f4f5" font-family="ui-sans-serif,system-ui,sans-serif" letter-spacing="-0.015em">${titleTspans}</text>
  ${tagChips}
  <line x1="${pad}" y1="${footerLineY}" x2="${width - pad}" y2="${footerLineY}" stroke="rgba(255,255,255,0.08)" />
  <text x="${pad}" y="${footerTextY}" font-size="${Math.round(width * 0.0163)}" fill="rgba(255,255,255,0.45)" font-family="ui-sans-serif,system-ui,sans-serif">Built in one prompt · Render-ready PDF</text>
  <g transform="translate(${width - pad - 8} ${footerTextY - 12})" opacity="0.5">
    <path d="M0 -12 L12 0 L0 12 L-12 0 Z" fill="${palette.accent}" />
  </g>
</svg>`;
};

sharePublic.get("/thumb/:slug", async (c) => {
  const db = getDb(c.env.DB);
  const rawSlug = c.req.param("slug");
  if (!rawSlug) return c.text("Not found", 404);
  const slug = rawSlug.replace(/\.svg$/, "");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!project) return c.text("Not found", 404);

  const tags = (project.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3);
  const svg = buildBrandSvg({
    slug,
    title: project.title,
    tags,
    pageSize: project.pageSize,
    width: 800,
    height: 600,
  });

  return c.body(svg, 200, {
    "content-type": "image/svg+xml; charset=utf-8",
    "cache-control": "public, max-age=86400, s-maxage=604800, immutable",
    "x-content-type-options": "nosniff",
  });
});

sharePublic.get("/og/:slug", async (c) => {
  const db = getDb(c.env.DB);
  const rawSlug = c.req.param("slug");
  if (!rawSlug) return c.text("Not found", 404);
  const slug = rawSlug.replace(/\.png$/, "");

  const cacheKey = `og:v1:${slug}`;
  const cached = await c.env.CACHE.get(cacheKey, "arrayBuffer");
  if (cached) {
    return c.body(cached, 200, {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=2592000, immutable",
      "x-content-type-options": "nosniff",
      "x-cache": "HIT",
    });
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!project) return c.text("Not found", 404);

  const tags = (project.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3);
  const svg = buildBrandSvg({
    slug,
    title: project.title,
    tags,
    pageSize: project.pageSize,
    width: 1200,
    height: 630,
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#0a0613;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`;

  Sentry.addBreadcrumb({
    category: "og",
    message: "puppeteer.screenshot",
    data: { slug, title: project.title },
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
    Sentry.captureException(err, { tags: { route: "og", step: "render" } });
    await browser.close();
    return c.redirect(`/s/thumb/${slug}.svg`, 302);
  }
  await browser.close();

  c.executionCtx?.waitUntil(
    c.env.CACHE.put(cacheKey, png, { expirationTtl: 60 * 60 * 24 * 30 })
  );

  return new Response(png as BodyInit, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=2592000, immutable",
      "x-content-type-options": "nosniff",
      "x-cache": "MISS",
    },
  });
});

sharePublic.get("/preview/:slug", async (c) => {
  const db = getDb(c.env.DB);
  const rawSlug = c.req.param("slug");
  if (!rawSlug) return c.text("Not found", 404);
  const slug = rawSlug.replace(/\.png$/, "");

  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!project) return c.text("Not found", 404);

  if (project.thumbnailKey) {
    const obj = await c.env.PDFS.get(project.thumbnailKey);
    if (obj) {
      return new Response(obj.body, {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=86400, s-maxage=604800, immutable",
          "x-content-type-options": "nosniff",
          "x-cache": "HIT",
        },
      });
    }
  }

  const fullHtml = wrapDocument(project.html, project.css, project.pageSize, project.margin);
  const dims = pageDimensionsIn(project.pageSize);

  Sentry.addBreadcrumb({
    category: "preview",
    message: "puppeteer.screenshot",
    data: { slug, pageSize: project.pageSize },
    level: "info",
  });

  let png: Uint8Array;
  const browser = await puppeteer.launch(c.env.BROWSER);
  try {
    const page = await browser.newPage();
    const widthPx = Math.round(dims.wIn * 96);
    const heightPx = Math.round(dims.hIn * 96);
    await page.setViewport({ width: widthPx, height: heightPx, deviceScaleFactor: 1 });
    await page.setContent(fullHtml, { waitUntil: "networkidle2", timeout: 30000 });
    await page
      .waitForFunction(() => (window as unknown as { __pdfReady?: boolean }).__pdfReady === true, { timeout: 10000 })
      .catch(() => {});
    const target = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".page");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
    });
    png = target
      ? await page.screenshot({
          type: "png",
          clip: { x: target.x, y: target.y, width: target.width, height: target.height },
        })
      : await page.screenshot({ type: "png", fullPage: false });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "preview", step: "render" } });
    await browser.close();
    return c.redirect(`/s/thumb/${slug}.svg`, 302);
  }
  await browser.close();

  const r2Key = `thumbnails/${slug}.png`;
  c.executionCtx?.waitUntil(
    Promise.all([
      c.env.PDFS.put(r2Key, png, {
        httpMetadata: { contentType: "image/png" },
        customMetadata: { kind: "thumbnail", slug },
      }),
      db
        .update(schema.projects)
        .set({ thumbnailKey: r2Key })
        .where(eq(schema.projects.id, project.id)),
    ])
  );

  return new Response(png as BodyInit, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=604800, immutable",
      "x-content-type-options": "nosniff",
      "x-cache": "MISS",
    },
  });
});

sharePublic.get("/:slug/render", async (c) => {
  const db = getDb(c.env.DB);
  const slug = c.req.param("slug");
  const link = await db.query.shareLinks.findFirst({ where: eq(schema.shareLinks.slug, slug) });
  if (!link) return c.text("Not found", 404);
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, link.projectId) });
  if (!project) return c.text("Not found", 404);
  return c.html(buildSharePreviewDoc(project.html, project.css, project.pageSize, project.margin), 200, {
    "cache-control": "public, max-age=60",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'none';",
  });
});

sharePublic.get("/:slug", async (c) => {
  const db = getDb(c.env.DB);
  const slug = c.req.param("slug");
  const link = await db.query.shareLinks.findFirst({
    where: eq(schema.shareLinks.slug, slug),
  });
  const notFound = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found · Megabyte PDF</title><style>:root{color-scheme:dark}body{margin:0;display:grid;place-items:center;min-height:100vh;background:#0a0a0f;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:24px}h1{font-size:2rem;margin:0 0 .5rem}p{color:#71717a;margin:0 0 1.5rem}a{color:#00E5FF;text-decoration:none;font-weight:600}</style></head><body><h1>Link not found</h1><p>This share link may have expired or been removed.</p><a href="${c.env.APP_URL ?? "https://pdf.megabyte.space"}">← Back to Megabyte PDF</a></body></html>`;
  if (!link) return c.html(notFound, 404);
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, link.projectId),
  });
  if (!project) return c.html(notFound, 404);
  c.executionCtx?.waitUntil(
    (async () => {
      await db
        .update(schema.shareLinks)
        .set({ views: sql`${schema.shareLinks.views} + 1` })
        .where(eq(schema.shareLinks.slug, slug));
      const nextViews = (link.views ?? 0) + 1;
      if (TRENDING_MILESTONES.includes(nextViews as 100 | 1000 | 10000)) {
        await maybeFireTrendingMilestone(c.env, link.projectId, slug, nextViews).catch((err) => {
          Sentry.captureException(err, { tags: { trigger: "trending_milestone", slug } });
        });
      }
    })()
  );

  const shareUrl = `${c.env.APP_URL}/s/${slug}`;
  const ogImage =
    project.isPublic && project.slug
      ? `${c.env.APP_URL}/s/og/${project.slug}.png`
      : `${c.env.APP_URL}/og.jpg`;
  const ogImageType = project.isPublic && project.slug ? "image/png" : "image/jpeg";
  const ogImageAlt = `${project.title} — Megabyte PDF`;
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(project.title)} · Megabyte PDF</title>
<meta name="description" content="View "${escapeHtml(project.title)}" — a print-ready PDF built with Megabyte PDF, the AI document designer." />
<meta name="robots" content="noindex,nofollow" />
<meta name="theme-color" content="#060610" />
<meta name="application-name" content="Megabyte PDF" />
<meta name="apple-mobile-web-app-title" content="PDF Share" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="manifest" href="/site.webmanifest" />
<link rel="canonical" href="${shareUrl}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(project.title)} · Megabyte PDF" />
<meta property="og:description" content="View &quot;${escapeHtml(project.title)}&quot; — a print-ready PDF built with Megabyte PDF, the AI document designer." />
<meta property="og:url" content="${shareUrl}" />
<meta property="og:site_name" content="Megabyte PDF" />
<meta property="og:locale" content="en_US" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:secure_url" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="${ogImageType}" />
<meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(project.title)} · Megabyte PDF" />
<meta name="twitter:description" content="View &quot;${escapeHtml(project.title)}&quot; — built with Megabyte PDF, the AI document designer." />
<meta name="twitter:image" content="${ogImage}" />
<meta name="twitter:image:alt" content="${escapeHtml(ogImageAlt)}" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #0a0a0f; color: #f4f4f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  header strong { font-weight: 700; letter-spacing: -0.01em; }
  header a { color: #00E5FF; text-decoration: none; font-size: 14px; }
  header a:hover { text-decoration: underline; }
  main { display: flex; justify-content: center; padding: 0 16px 64px; }
  .frame { width: min(8.5in, 100%); }
  .frame iframe { width: 100%; height: 700px; border: 0; display: block; border-radius: 4px; box-shadow: 0 24px 80px rgba(0,0,0,0.5); transition: height 0.3s ease; }
  footer { text-align: center; padding: 24px; color: #71717a; font-size: 13px; }
  footer a { color: #50AAE3; text-decoration: none; }
</style>
</head>
<body>
<a href="#doc-frame" class="skip-link" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;background:#00E5FF;color:#060610;font-weight:600;padding:8px 16px;border-radius:0 0 8px 0;z-index:999" onfocus="this.style.left='0';this.style.width='auto';this.style.height='auto'" onblur="this.style.left='-9999px';this.style.width='1px';this.style.height='1px'">Skip to document</a>
<header>
  <strong aria-label="Document: ${escapeHtml(project.title)}">${escapeHtml(project.title)}</strong>
  <a href="${c.env.APP_URL}" rel="noopener">Made with Megabyte PDF →</a>
</header>
<main aria-label="Document preview">
  <div class="frame">
    <iframe sandbox="allow-scripts" src="${shareUrl}/render" id="doc-frame" title="${escapeHtml(project.title)} — read-only preview" loading="lazy"></iframe>
  </div>
</main>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'share:rendered' && typeof e.data.height === 'number') {
    var f = document.getElementById('doc-frame');
    if (f) f.style.height = Math.max(700, e.data.height + 48) + 'px';
  }
});
</script>
<footer>
  <p>Read-only preview · <a href="${c.env.APP_URL}/guest" rel="noopener" style="color:#00E5FF;font-weight:600">Try Megabyte PDF free →</a> · Prompt the AI. Watch every page render live. Download a real PDF.</p>
</footer>
</body>
</html>`;

  return c.html(page, 200, {
    "cache-control": "public, max-age=60",
  });
});
