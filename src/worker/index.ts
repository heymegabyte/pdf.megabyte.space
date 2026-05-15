import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
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
import podcast, { podcastPublic } from "./routes/podcast";
import newsletter from "./routes/newsletter";
import { ogRoutes } from "./routes/og-template";
import feeds from "./routes/feeds";
import ogCard from "./routes/og-card";
import puppeteer from "@cloudflare/puppeteer";
import { buildSharePreviewDoc, wrapDocument, pageDimensionsIn } from "./lib/templates";
import { strictSecureHeaders, isUserRenderPath } from "./lib/security-headers";
import {
  corsOriginMatcher,
  CORS_ALLOW_HEADERS,
  CORS_ALLOW_METHODS,
} from "./lib/cors-config";
import { optionalAuth, requireAuth } from "./middleware/auth";
import { getDb, schema } from "./db";
import { eq, and, isNull, count } from "drizzle-orm";
import type { Env, Variables } from "./types";
import { projectLimit, PRO_PRICE_USD, UNLIMITED_PRICE_USD } from "../shared/plans";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: corsOriginMatcher,
    credentials: true,
    allowHeaders: [...CORS_ALLOW_HEADERS],
    allowMethods: [...CORS_ALLOW_METHODS],
  })
);
app.use("*", async (c, next) => {
  const pathname = new URL(c.req.url).pathname;
  if (isUserRenderPath(pathname)) {
    return next();
  }
  return strictSecureHeaders(c, next);
});

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
    unlimitedEnabled: Boolean(c.env.STRIPE_SECRET_KEY && c.env.STRIPE_PRICE_ID_UNLIMITED),
    proPriceUsd: PRO_PRICE_USD,
    unlimitedPriceUsd: UNLIMITED_PRICE_USD,
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
  const limit = projectLimit(
    user.plan,
    Number(c.env.FREE_PROJECT_LIMIT),
    Number(c.env.PAID_PROJECT_LIMIT)
  );
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
  const plan =
    body?.plan === "pro"
      ? "pro"
      : body?.plan === "unlimited"
        ? "unlimited"
        : body?.plan === "free"
          ? "free"
          : null;
  if (!plan) return c.json({ error: "plan must be 'free', 'pro', or 'unlimited'" }, 400);
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
app.route("/api/podcast", podcast);
app.route("/api/newsletter", newsletter);
app.route("/api/og", ogCard);
app.route("/", feeds);

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
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'none'; frame-ancestors 'self'; base-uri 'none';",
    }
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

app.route("/s", sharePublic);
app.route("/og", ogRoutes);
app.route("/podcast", podcastPublic);

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
  if (
    c.req.path.startsWith("/api/") ||
    c.req.path.startsWith("/s/") ||
    c.req.path.startsWith("/og/")
  ) {
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
