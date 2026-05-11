import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import { buildSharePreviewDoc } from "../lib/templates";
import type { Env, Variables } from "../types";

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
    db.update(schema.shareLinks)
      .set({ views: sql`${schema.shareLinks.views} + 1` })
      .where(eq(schema.shareLinks.slug, slug))
  );

  const shareUrl = `${c.env.APP_URL}/s/${slug}`;
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
<meta property="og:image" content="${c.env.APP_URL}/og.jpg" />
<meta property="og:image:secure_url" content="${c.env.APP_URL}/og.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:alt" content="Megabyte PDF — AI-powered document design" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(project.title)} · Megabyte PDF" />
<meta name="twitter:description" content="View &quot;${escapeHtml(project.title)}&quot; — built with Megabyte PDF, the AI document designer." />
<meta name="twitter:image" content="${c.env.APP_URL}/og.jpg" />
<meta name="twitter:image:alt" content="Megabyte PDF — AI-powered document design" />
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
