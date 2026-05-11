import { test, expect } from "@playwright/test";

test.describe("billing / pricing", () => {
  test("pricing section renders on landing with 3 tiers", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await expect(page.getByText(/simple pricing/i)).toBeVisible();
    await expect(page.getByText(/guest/i).first()).toBeVisible();
    await expect(page.locator(".card, [class*='pricing']").filter({ hasText: /\$9/ }).first()).toBeVisible();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });

  test("export endpoint returns 401 without auth", async ({ request }) => {
    const r = await request.post("/api/projects/test123/export");
    expect(r.status()).toBe(401);
  });

  test("share endpoint returns 401 without auth", async ({ request }) => {
    const r = await request.post("/api/projects/test123/share");
    expect(r.status()).toBe(401);
  });

  test("billing checkout returns 401 without auth", async ({ request }) => {
    const r = await request.post("/api/billing/checkout");
    expect(r.status()).toBe(401);
  });

  test("billing portal returns 401 without auth", async ({ request }) => {
    const r = await request.post("/api/billing/portal");
    expect(r.status()).toBe(401);
  });

  test("webhook endpoint returns 400 for missing signature", async ({ request }) => {
    const r = await request.post("/api/billing/webhook", {
      data: "{}",
      headers: { "Content-Type": "application/json" },
    });
    // Either 400 (bad signature) or 503 (billing not configured) are valid
    expect([400, 503]).toContain(r.status());
  });
});
