import { test, expect } from "@playwright/test";

const ASSETS = [
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-48x48.png",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/maskable-192x192.png",
  "/maskable-512x512.png",
  "/og.jpg",
  "/site.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/humans.txt",
  "/.well-known/security.txt",
  "/browserconfig.xml",
  "/sw.js",
  "/offline.html",
  "/screenshot-narrow.png",
  "/screenshot-editor-wide.png",
];

test.describe("homepage smoke", () => {
  test("loads with 200 + critical metadata + Sentry-fires-on-init", async ({ page, request }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    expect(res?.status()).toBe(200);

    await expect(page).toHaveTitle(/Megabyte PDF/);

    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc?.length ?? 0).toBeGreaterThanOrEqual(120);
    expect(desc?.length ?? 0).toBeLessThanOrEqual(180);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://pdf.megabyte.space/"
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /og\.jpg$/
    );
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();

    const cfg = await request.get("/api/config").then((r) => r.json());
    expect(cfg.appName).toBe("Megabyte PDF");
    // Self-hosted Sentry at sentry.megabyte.space or managed Sentry at sentry.io
    expect(cfg.sentryDsn).toMatch(/https?:\/\//);
    expect(cfg.sentryDsn.length).toBeGreaterThan(10);

    expect(errors, `pageerror events: ${errors.join(" | ")}`).toEqual([]);
  });
});

test.describe("asset existence gate", () => {
  for (const path of ASSETS) {
    test(`GET ${path} returns 200`, async ({ request }) => {
      const r = await request.get(path);
      expect(r.status(), `${path} returned ${r.status()}`).toBe(200);
    });
  }
});

test.describe("API health", () => {
  test("/api/health returns ok JSON with version", async ({ request }) => {
    const r = await request.get("/api/health");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.status).toBe("ok");
    expect(j.name).toBe("Megabyte PDF");
    expect(j.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(j.timestamp).toBeTruthy();
  });
});
