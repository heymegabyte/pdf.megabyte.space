import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import * as Sentry from "@sentry/cloudflare";
import projects from "./routes/projects";
import chat from "./routes/chat";
import exportRoutes from "./routes/export";
import { shareApi, sharePublic } from "./routes/share";
import explore from "./routes/explore";
import billing from "./routes/billing";
import guest from "./routes/guest";
import auth from "./routes/auth";
import follows from "./routes/follows";
import email from "./routes/email";
import assistant from "./routes/assistant";
import puppeteer from "@cloudflare/puppeteer";
import { buildSharePreviewDoc, wrapDocument, pageDimensionsIn } from "./lib/templates";
import { optionalAuth, requireAuth } from "./middleware/auth";
import { getDb, schema } from "./db";
import { eq, and, isNull, count, desc, like, sql } from "drizzle-orm";
import type { Env, Variables } from "./types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const appUrl = c.env?.APP_URL ?? "";
      const allowed = [appUrl, "https://pdf.megabyte.space", "http://localhost:5173"];
      return allowed.includes(origin) ? origin : null;
    },
    credentials: true,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(
  "*",
  secureHeaders({
    xFrameOptions: false,
    xXssProtection: false,
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://www.googletagmanager.com",
        "https://js.stripe.com",
        "https://challenges.cloudflare.com",
        "https://us-assets.i.posthog.com",
        "https://static.cloudflareinsights.com",
      ],
      connectSrc: [
        "'self'",
        "https://*.sentry.io",
        "https://ingest.sentry.io",
        "https://sentry.megabyte.space",
        "https://us.i.posthog.com",
        "https://us-assets.i.posthog.com",
        "https://app.posthog.com",
        "https://www.google-analytics.com",
        "https://analytics.google.com",
        "https://region1.google-analytics.com",
        "https://www.google.com",
        "https://www.googletagmanager.com",
        "https://api.stripe.com",
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        "https://www.googleapis.com",
        "https://static.cloudflareinsights.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://lh3.googleusercontent.com",
      ],
      frameSrc: [
        "https://www.googletagmanager.com",
        "https://js.stripe.com",
        "https://challenges.cloudflare.com",
        "https://accounts.google.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      reportUri: ["https://sentry.megabyte.space/api/security/?sentry_key=megabyte-pdf"],
    },
  })
);

app.get("/api/health", async (c) => {
  const start = Date.now();
  let dbOk = false;
  let publicCount = 0;
  try {
    const db = getDb(c.env.DB);
    const r = await db
      .select({ n: count() })
      .from(schema.projects)
      .where(eq(schema.projects.isPublic, true));
    publicCount = r[0]?.n ?? 0;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return c.json({
    status: dbOk ? "ok" : "degraded",
    name: c.env.APP_NAME,
    version: c.env.APP_VERSION,
    timestamp: new Date().toISOString(),
    checks: {
      db: dbOk,
      latencyMs: Date.now() - start,
    },
    metrics: {
      publicProjects: publicCount,
    },
  });
});

app.get("/api/config", (c) =>
  c.json({
    appName: c.env.APP_NAME,
    appUrl: c.env.APP_URL,
    googleSignInEnabled: Boolean(c.env.GOOGLE_CLIENT_ID),
    billingEnabled: Boolean(c.env.STRIPE_SECRET_KEY && c.env.STRIPE_PRICE_ID_PRO),
    freeLimit: Number(c.env.FREE_PROJECT_LIMIT),
    paidLimit: Number(c.env.PAID_PROJECT_LIMIT),
    sentryDsn: c.env.SENTRY_DSN_CLIENT ?? "",
    posthogKey: c.env.POSTHOG_API_KEY ?? "",
    posthogHost: c.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
    gtmId: c.env.GTM_CONTAINER_ID ?? "",
    ga4Id: c.env.GA4_MEASUREMENT_ID ?? "",
  })
);

app.get("/api/me", optionalAuth, async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ user: null, usage: null });
  const db = getDb(c.env.DB);
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) return c.json({ user: null, usage: null });
  const projectCount = await db
    .select({ n: count() })
    .from(schema.projects)
    .where(and(eq(schema.projects.userId, userId), isNull(schema.projects.deletedAt)));
  const limit =
    user.plan === "pro"
      ? Number(c.env.PAID_PROJECT_LIMIT)
      : Number(c.env.FREE_PROJECT_LIMIT);
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      plan: user.plan,
      isAdmin: Boolean(c.env.ADMIN_EMAIL && user.email === c.env.ADMIN_EMAIL),
    },
    usage: {
      projectCount: projectCount[0]?.n ?? 0,
      projectLimit: limit,
    },
  });
});

// Admin-only: flip the signed-in admin's own plan between free/pro for
// testing plan-gated UI without touching Stripe. Locked to ADMIN_EMAIL.
app.post("/api/admin/plan", optionalAuth, async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = getDb(c.env.DB);
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user || !c.env.ADMIN_EMAIL || user.email !== c.env.ADMIN_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const body = (await c.req.json().catch(() => null)) as { plan?: unknown } | null;
  const plan = body?.plan === "pro" ? "pro" : body?.plan === "free" ? "free" : null;
  if (!plan) return c.json({ error: "plan must be 'free' or 'pro'" }, 400);
  await db.update(schema.users).set({ plan }).where(eq(schema.users.id, userId));
  return c.json({ ok: true, plan });
});

app.route("/api/auth", auth);
app.route("/api/projects", projects);
app.route("/api", chat);
app.route("/api", exportRoutes);
app.route("/api", shareApi);
app.route("/api/explore", explore);
app.route("/api/billing", billing);
app.route("/api/guest", guest);
app.route("/api/follows", follows);
app.route("/api/email", email);
app.route("/api/assistant", assistant);

// Public-PDF iframe preview (served by /p/:slug client page)
app.get("/api/public/:slug/render", async (c) => {
  const db = getDb(c.env.DB);
  const slug = c.req.param("slug");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!project) return c.text("Not found", 404);
  return c.html(
    buildSharePreviewDoc(project.html, project.css, project.pageSize, project.margin),
    200,
    {
      "cache-control": "public, max-age=120",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'none';",
    }
  );
});

const xmlEscape = (s: string) =>
  s.replace(/[<>&'"]/g, (ch) =>
    ch === "<" ? "&lt;" :
    ch === ">" ? "&gt;" :
    ch === "&" ? "&amp;" :
    ch === "'" ? "&apos;" : "&quot;"
  );

app.get("/sitemap.xml", async (c) => {
  const db = getDb(c.env.DB);
  const origin = c.env.APP_URL ?? `${new URL(c.req.url).origin}`;
  const staticUrls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/explore", priority: "0.9", changefreq: "daily" },
    { loc: "/sign-in", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  ];
  let publicProjects: { slug: string | null; updatedAt: Date }[] = [];
  try {
    publicProjects = await db
      .select({ slug: schema.projects.slug, updatedAt: schema.projects.updatedAt })
      .from(schema.projects)
      .where(and(eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)))
      .limit(5000);
  } catch {
    // degrade to static-only
  }
  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];
  for (const u of staticUrls) {
    entries.push(
      `<url><loc>${xmlEscape(origin + u.loc)}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    );
  }
  for (const p of publicProjects) {
    if (!p.slug) continue;
    const lastmod = new Date(p.updatedAt).toISOString().slice(0, 10);
    entries.push(
      `<url><loc>${xmlEscape(origin + "/c/" + p.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    );
  }
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    entries.join("") +
    `</urlset>`;
  return c.body(xml, 200, {
    "content-type": "application/xml; charset=utf-8",
    "cache-control": "public, max-age=1800",
  });
});

app.get("/feed.xml", async (c) => {
  const db = getDb(c.env.DB);
  const origin = c.env.APP_URL ?? `${new URL(c.req.url).origin}`;
  const tag = (c.req.query("tag") ?? "").trim().toLowerCase().slice(0, 40) || null;
  let rows: {
    slug: string | null;
    title: string;
    description: string | null;
    updatedAt: Date;
    createdAt: Date;
  }[] = [];
  try {
    const baseWhere = [eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)];
    if (tag) baseWhere.push(like(sql`lower(${schema.projects.tags})`, `%${tag}%`));
    rows = await db
      .select({
        slug: schema.projects.slug,
        title: schema.projects.title,
        description: schema.projects.description,
        updatedAt: schema.projects.updatedAt,
        createdAt: schema.projects.createdAt,
      })
      .from(schema.projects)
      .where(and(...baseWhere))
      .orderBy(desc(schema.projects.updatedAt))
      .limit(50);
  } catch {
    rows = [];
  }
  const items = rows
    .filter((r) => r.slug)
    .map((r) => {
      const url = `${origin}/c/${r.slug}`;
      const pubDate = new Date(r.createdAt).toUTCString();
      return (
        `<item>` +
        `<title>${xmlEscape(r.title)}</title>` +
        `<link>${xmlEscape(url)}</link>` +
        `<guid isPermaLink="true">${xmlEscape(url)}</guid>` +
        `<pubDate>${pubDate}</pubDate>` +
        `<description>${xmlEscape(r.description ?? r.title)}</description>` +
        `</item>`
      );
    })
    .join("");
  const feedTitle = tag
    ? `Megabyte PDF — ${tag.charAt(0).toUpperCase()}${tag.slice(1)} PDFs`
    : `Megabyte PDF — Community feed`;
  const feedDesc = tag
    ? `Recently published community PDFs tagged "${tag}".`
    : `Recently published community PDFs.`;
  const feedHome = tag ? `${origin}/t/${tag}` : `${origin}/explore`;
  const feedSelf = tag ? `${origin}/feed.xml?tag=${tag}` : `${origin}/feed.xml`;
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">` +
    `<channel>` +
    `<title>${xmlEscape(feedTitle)}</title>` +
    `<link>${xmlEscape(feedHome)}</link>` +
    `<atom:link href="${xmlEscape(feedSelf)}" rel="self" type="application/rss+xml" />` +
    `<description>${xmlEscape(feedDesc)}</description>` +
    `<language>en-us</language>` +
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>` +
    items +
    `</channel></rss>`;
  return c.body(xml, 200, {
    "content-type": "application/rss+xml; charset=utf-8",
    "cache-control": "public, max-age=900",
  });
});

app.get("/feed.json", async (c) => {
  const db = getDb(c.env.DB);
  const origin = c.env.APP_URL ?? `${new URL(c.req.url).origin}`;
  const tag = (c.req.query("tag") ?? "").trim().toLowerCase().slice(0, 40) || null;
  let rows: {
    slug: string | null;
    title: string;
    description: string | null;
    updatedAt: Date;
    createdAt: Date;
  }[] = [];
  try {
    const baseWhere = [eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)];
    if (tag) baseWhere.push(like(sql`lower(${schema.projects.tags})`, `%${tag}%`));
    rows = await db
      .select({
        slug: schema.projects.slug,
        title: schema.projects.title,
        description: schema.projects.description,
        updatedAt: schema.projects.updatedAt,
        createdAt: schema.projects.createdAt,
      })
      .from(schema.projects)
      .where(and(...baseWhere))
      .orderBy(desc(schema.projects.updatedAt))
      .limit(50);
  } catch {
    rows = [];
  }
  const feedTitle = tag
    ? `Megabyte PDF — ${tag.charAt(0).toUpperCase()}${tag.slice(1)} PDFs`
    : `Megabyte PDF — Community feed`;
  return c.json(
    {
      version: "https://jsonfeed.org/version/1.1",
      title: feedTitle,
      home_page_url: tag ? `${origin}/t/${tag}` : `${origin}/explore`,
      feed_url: tag ? `${origin}/feed.json?tag=${tag}` : `${origin}/feed.json`,
      items: rows
        .filter((r) => r.slug)
        .map((r) => ({
          id: `${origin}/c/${r.slug}`,
          url: `${origin}/c/${r.slug}`,
          title: r.title,
          summary: r.description ?? r.title,
          date_published: new Date(r.createdAt).toISOString(),
          date_modified: new Date(r.updatedAt).toISOString(),
          image: `${origin}/api/og/${r.slug}`,
        })),
    },
    200,
    { "cache-control": "public, max-age=900" }
  );
});

const PUBLIC_PDF_DAILY_LIMIT = 10;

app.get("/api/public/:slug/pdf", async (c) => {
  const db = getDb(c.env.DB);
  const slug = c.req.param("slug");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const ip = c.req.header("CF-Connecting-IP") ?? "anon";
  const day = new Date().toISOString().slice(0, 10);
  const rateKey = `ratelimit:public-pdf:${ip}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= PUBLIC_PDF_DAILY_LIMIT) {
    return c.json(
      { error: "Daily download limit reached. Try again tomorrow or remix to your account.", code: "RATE_LIMIT" },
      429
    );
  }

  const safeTitle =
    project.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60) || "document";
  const updatedAtKey = new Date(project.updatedAt).getTime();
  const r2Key = `public/${slug}/${updatedAtKey}.pdf`;

  let pdfBody: ReadableStream | ArrayBuffer;
  const cached = await c.env.PDFS.get(r2Key);
  if (cached) {
    pdfBody = cached.body!;
  } else {
    const fullHtml = wrapDocument(project.html, project.css, project.pageSize, project.margin);
    const dims = pageDimensionsIn(project.pageSize);
    Sentry.addBreadcrumb({
      category: "pdf",
      message: "public.pdf",
      data: { slug, htmlBytes: fullHtml.length },
      level: "info",
    });
    let pdf: Uint8Array;
    const browser = await puppeteer.launch(c.env.BROWSER);
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: Math.round(dims.wIn * 96), height: Math.round(dims.hIn * 96) });
      await page.setContent(fullHtml, { waitUntil: "networkidle2", timeout: 30000 });
      await page.waitForFunction(() => (window as unknown as { __pdfReady?: boolean }).__pdfReady === true, { timeout: 10000 }).catch(() => {});
      pdf = await page.pdf({
        width: `${dims.wIn}in`,
        height: `${dims.hIn}in`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { route: "public-pdf" } });
      await browser.close();
      return c.json({ error: "PDF generation failed. Please try again." }, 502);
    }
    await browser.close();

    c.executionCtx.waitUntil(
      c.env.PDFS.put(r2Key, pdf, {
        httpMetadata: {
          contentType: "application/pdf",
          contentDisposition: `inline; filename="${safeTitle}.pdf"`,
        },
        customMetadata: { slug, title: project.title },
      }).catch(() => {})
    );
    pdfBody = pdf.buffer as ArrayBuffer;
  }

  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  return new Response(pdfBody, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${safeTitle}.pdf"`,
      "cache-control": "public, max-age=300",
      "x-ratelimit-limit": String(PUBLIC_PDF_DAILY_LIMIT),
      "x-ratelimit-remaining": String(Math.max(0, PUBLIC_PDF_DAILY_LIMIT - used - 1)),
    },
  });
});

const svgEscape = (s: string) =>
  s.replace(/[<>&'"]/g, (ch) =>
    ch === "<" ? "&lt;" :
    ch === ">" ? "&gt;" :
    ch === "&" ? "&amp;" :
    ch === "'" ? "&apos;" : "&quot;"
  );

const wrapWords = (text: string, maxChars: number, maxLines: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (lines.length >= maxLines) break;
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[lines.length - 1];
    if (last) lines[lines.length - 1] = last.replace(/.{1,3}$/, "…");
  }
  return lines;
};

app.get("/api/og/:slug", async (c) => {
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
    .map((line, i) => `<text x="80" y="${230 + i * 88}" font-size="76" font-weight="800" fill="#ffffff" font-family="Inter, system-ui, sans-serif" letter-spacing="-2">${svgEscape(line)}</text>`)
    .join("");
  const tagSvg = tags
    .map((t, i) => `<g transform="translate(${80 + i * 150}, 510)"><rect width="135" height="42" rx="21" fill="rgba(0,229,255,0.12)" stroke="#00E5FF" stroke-opacity="0.4"/><text x="67.5" y="27" font-size="18" font-weight="600" fill="#00E5FF" font-family="Inter, system-ui, sans-serif" text-anchor="middle">${svgEscape(t)}</text></g>`)
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

app.route("/s", sharePublic);

app.onError((err, c) => {
  console.error("[worker error]", err);
  Sentry.captureException(err, {
    tags: { route: c.req.path, method: c.req.method },
    extra: { url: c.req.url, userId: c.get("userId") },
  });
  return c.json(
    {
      error: err.message ?? "Internal error",
      code: "INTERNAL",
    },
    500
  );
});

app.notFound((c) => {
  if (c.req.path.startsWith("/api/") || c.req.path.startsWith("/s/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

import { runCron } from "./cron";

const handler = {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runCron(env, controller));
  },
};

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN ?? "",
    enabled: Boolean(env.SENTRY_DSN),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  }),
  handler
);
