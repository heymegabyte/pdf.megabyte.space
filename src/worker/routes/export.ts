import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import puppeteer from "@cloudflare/puppeteer";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import { wrapDocument, pageDimensionsIn } from "../lib/templates";
import { ensureFreshAccessToken, uploadPdfToDrive } from "../lib/drive";
import { sendEmail } from "../lib/emails";
import type { Env, Variables } from "../types";
import { isPaid, isUnlimited } from "../../shared/plans";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const EXPORT_DAILY_LIMIT_PRO = 20;
const EXPORT_DAILY_LIMIT_UNLIMITED = 500;

app.post("/projects/:id/export", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user || !isPaid(user.plan)) {
    return c.json({ error: "PDF export requires a Pro or Unlimited subscription.", code: "PLAN_REQUIRED" }, 402);
  }

  const EXPORT_DAILY_LIMIT = isUnlimited(user.plan) ? EXPORT_DAILY_LIMIT_UNLIMITED : EXPORT_DAILY_LIMIT_PRO;
  const day = new Date().toISOString().slice(0, 10);
  const rateKey = `ratelimit:export:${userId}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  const exportRemaining = Math.max(0, EXPORT_DAILY_LIMIT - used);
  if (used >= EXPORT_DAILY_LIMIT) {
    // Pro hitting the ceiling = upsell signal. Fire one email per day.
    if (user.plan === "pro") {
      c.executionCtx.waitUntil(
        sendEmail(c.env, {
          userId,
          template: "export-limit-pro",
          dedupKey: `export-limit-pro:${userId}:${day}`,
          data: {
            limit: EXPORT_DAILY_LIMIT_PRO,
            unlimited_limit: EXPORT_DAILY_LIMIT_UNLIMITED,
            upgrade_url: `${c.env.APP_URL}/dashboard?upgrade=unlimited`,
            day,
          },
        }).catch(() => {})
      );
    }
    return c.json(
      { error: "Daily export limit reached. Try again tomorrow.", code: "RATE_LIMIT", limit: EXPORT_DAILY_LIMIT, used },
      429,
      {
        "X-RateLimit-Limit": String(EXPORT_DAILY_LIMIT),
        "X-RateLimit-Remaining": "0",
        "Retry-After": String(60 * 60 * (24 - new Date().getUTCHours())),
      }
    );
  }
  const fullHtml = wrapDocument(project.html, project.css, project.pageSize, project.margin);

  Sentry.addBreadcrumb({
    category: "pdf",
    message: "puppeteer.pdf",
    data: { projectId: id, userId, pageSize: project.pageSize, htmlBytes: fullHtml.length },
    level: "info",
  });
  const dims = pageDimensionsIn(project.pageSize);
  let pdf: Uint8Array;
  const browser = await puppeteer.launch(c.env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: Math.round(dims.wIn * 96), height: Math.round(dims.hIn * 96) });
    await page.setContent(fullHtml, { waitUntil: "networkidle2", timeout: 30000 });
    // Wait for shared pagination script to flush layout (sets window.__pdfReady).
    await page.waitForFunction(() => (window as unknown as { __pdfReady?: boolean }).__pdfReady === true, { timeout: 10000 }).catch(() => {});
    pdf = await page.pdf({
      width: `${dims.wIn}in`,
      height: `${dims.hIn}in`,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } catch (err) {
    Sentry.captureException(err);
    await browser.close();
    return c.json({ error: "PDF generation failed. Please try again." }, 502);
  }
  await browser.close();

  const exportId = nanoid(12);
  const safeTitle =
    project.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60) || "document";
  const r2Key = `${userId}/${id}/${exportId}-${safeTitle}.pdf`;

  try {
    await c.env.PDFS.put(r2Key, pdf, {
      httpMetadata: {
        contentType: "application/pdf",
        contentDisposition: `attachment; filename="${safeTitle}.pdf"`,
      },
      customMetadata: { userId, projectId: id, title: project.title },
    });
    await db.insert(schema.exports).values({
      id: exportId,
      projectId: id,
      r2Key,
      bytes: pdf.byteLength,
    });
    await db
      .update(schema.projects)
      .set({ lastRenderAt: new Date() })
      .where(eq(schema.projects.id, id));
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "export", step: "store_pdf" } });
    return c.json({ error: "PDF generated but could not be saved. Please try again." }, 502);
  }

  // Only consume the rate quota after successful storage
  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  // First-pdf trigger: fires once per user on first successful export.
  // Dedup key is per-user, so subsequent exports won't re-trigger.
  c.executionCtx.waitUntil(
    sendEmail(c.env, {
      userId,
      template: "first-pdf",
      dedupKey: `first-pdf:${userId}`,
      data: {
        project_title: project.title,
        project_url: `${c.env.APP_URL}/projects/${id}`,
        og_image_url: `${c.env.APP_URL}/s/og/${id}.png`,
        share_url: `${c.env.APP_URL}/projects/${id}`,
        download_url: `${c.env.APP_URL}/api/projects/${id}/export/${exportId}/download`,
        pdf_bytes: pdf.byteLength,
      },
    }).catch(() => {})
  );

  return c.json(
    {
      ok: true,
      bytes: pdf.byteLength,
      downloadUrl: `/api/projects/${id}/export/${exportId}/download`,
      filename: `${safeTitle}.pdf`,
    },
    200,
    {
      "X-RateLimit-Limit": String(EXPORT_DAILY_LIMIT),
      "X-RateLimit-Remaining": String(exportRemaining - 1),
    }
  );
});

const DRIVE_DAILY_LIMIT = 20;

app.post("/projects/:id/drive", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");

  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) return c.json({ error: "Not found" }, 404);
  if (!user.googleRefreshToken && !user.googleAccessToken) {
    return c.json(
      { error: "Reconnect Google to enable Drive saving.", code: "GOOGLE_REAUTH" },
      403
    );
  }

  const day = new Date().toISOString().slice(0, 10);
  const rateKey = `ratelimit:drive:${userId}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= DRIVE_DAILY_LIMIT) {
    return c.json(
      { error: "Daily Drive save limit reached. Try again tomorrow.", code: "RATE_LIMIT" },
      429
    );
  }

  const accessToken = await ensureFreshAccessToken(c.env, user);
  if (!accessToken) {
    return c.json(
      { error: "Reconnect Google to enable Drive saving.", code: "GOOGLE_REAUTH" },
      403
    );
  }

  const fullHtml = wrapDocument(project.html, project.css, project.pageSize, project.margin);

  const dims = pageDimensionsIn(project.pageSize);
  let pdf: Uint8Array;
  const browser = await puppeteer.launch(c.env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: Math.round(dims.wIn * 96), height: Math.round(dims.hIn * 96) });
    await page.setContent(fullHtml, { waitUntil: "networkidle2", timeout: 30000 });
    // Wait for shared pagination script to flush layout (sets window.__pdfReady).
    await page.waitForFunction(() => (window as unknown as { __pdfReady?: boolean }).__pdfReady === true, { timeout: 10000 }).catch(() => {});
    pdf = await page.pdf({
      width: `${dims.wIn}in`,
      height: `${dims.hIn}in`,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "drive", step: "render" } });
    await browser.close();
    return c.json({ error: "PDF generation failed. Please try again." }, 502);
  }
  await browser.close();

  const safeTitle =
    project.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60) || "document";
  const filename = `${safeTitle}.pdf`;

  let driveFile: Awaited<ReturnType<typeof uploadPdfToDrive>>;
  try {
    driveFile = await uploadPdfToDrive(accessToken, filename, pdf);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "drive", step: "upload" } });
    return c.json(
      { error: "Could not save to Drive. Try again or reconnect Google.", code: "DRIVE_UPLOAD" },
      502
    );
  }

  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  return c.json({
    ok: true,
    file: {
      id: driveFile.id,
      name: driveFile.name,
      webViewLink: driveFile.webViewLink ?? null,
    },
  });
});

const PNG_DAILY_LIMIT = 30;

app.post("/projects/:id/export-png", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const day = new Date().toISOString().slice(0, 10);
  const rateKey = `ratelimit:export-png:${userId}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= PNG_DAILY_LIMIT) {
    return c.json(
      { error: "Daily PNG export limit reached. Try again tomorrow.", code: "RATE_LIMIT" },
      429
    );
  }

  const pageIndex = Math.max(0, Number(c.req.query("page") ?? "0") | 0);
  const fullHtml = wrapDocument(project.html, project.css, project.pageSize, project.margin);
  const dims = pageDimensionsIn(project.pageSize);

  Sentry.addBreadcrumb({
    category: "png",
    message: "puppeteer.screenshot",
    data: { projectId: id, userId, pageSize: project.pageSize, pageIndex },
    level: "info",
  });

  let png: Uint8Array;
  const browser = await puppeteer.launch(c.env.BROWSER);
  try {
    const page = await browser.newPage();
    const widthPx = Math.round(dims.wIn * 96);
    const heightPx = Math.round(dims.hIn * 96);
    await page.setViewport({ width: widthPx, height: heightPx, deviceScaleFactor: 2 });
    await page.setContent(fullHtml, { waitUntil: "networkidle2", timeout: 30000 });
    await page
      .waitForFunction(() => (window as unknown as { __pdfReady?: boolean }).__pdfReady === true, { timeout: 10000 })
      .catch(() => {});
    const target = await page.evaluate((idx: number) => {
      const pages = document.querySelectorAll<HTMLElement>(".page");
      const el = pages[idx] ?? pages[0];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
    }, pageIndex);
    png = target
      ? await page.screenshot({
          type: "png",
          clip: { x: target.x, y: target.y, width: target.width, height: target.height },
        })
      : await page.screenshot({ type: "png", fullPage: false });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "export-png", step: "render" } });
    await browser.close();
    return c.json({ error: "PNG generation failed. Please try again." }, 502);
  }
  await browser.close();

  const exportId = nanoid(12);
  const safeTitle =
    project.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60) || "document";
  const r2Key = `${userId}/${id}/${exportId}-${safeTitle}-p${pageIndex + 1}.png`;

  try {
    await c.env.PDFS.put(r2Key, png, {
      httpMetadata: {
        contentType: "image/png",
        contentDisposition: `attachment; filename="${safeTitle}-p${pageIndex + 1}.png"`,
      },
      customMetadata: { userId, projectId: id, title: project.title, kind: "png", page: String(pageIndex) },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "export-png", step: "store" } });
    return c.json({ error: "PNG generated but could not be saved. Please try again." }, 502);
  }

  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  return c.json({
    ok: true,
    bytes: png.byteLength,
    downloadUrl: `/api/projects/${id}/export-png/${exportId}/download?key=${encodeURIComponent(r2Key)}`,
    filename: `${safeTitle}-p${pageIndex + 1}.png`,
  });
});

app.get("/projects/:id/export-png/:exportId/download", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const key = c.req.query("key");
  if (!key || !key.startsWith(`${userId}/${id}/`) || !key.endsWith(".png")) {
    return c.json({ error: "Not found" }, 404);
  }
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const obj = await c.env.PDFS.get(key);
  if (!obj) return c.json({ error: "Missing artifact" }, 404);
  const safeTitle =
    project.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60) || "document";
  return new Response(obj.body, {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="${safeTitle}.png"`,
      "cache-control": "private, max-age=3600",
    },
  });
});

app.get("/projects/:id/export/:exportId/download", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const exportId = c.req.param("exportId");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const exp = await db.query.exports.findFirst({ where: eq(schema.exports.id, exportId) });
  if (!exp || exp.projectId !== id) return c.json({ error: "Not found" }, 404);
  const obj = await c.env.PDFS.get(exp.r2Key);
  if (!obj) return c.json({ error: "Missing artifact" }, 404);
  const safeTitle =
    project.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60) || "document";
  return new Response(obj.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${safeTitle}.pdf"`,
      "cache-control": "private, max-age=3600",
    },
  });
});

export default app;
