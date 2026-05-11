import { test, expect } from "@playwright/test";

test.describe("guest mode", () => {
  test("landing CTA routes to /guest editor", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const cta = page.getByRole("link", { name: /try it now — no signup/i });
    await expect(cta).toBeVisible();
    await cta.click();

    await page.waitForURL(/\/guest$/);
    await expect(page.getByText(/Guest/i).first()).toBeVisible();
    await expect(page.getByTestId("guest-prompt")).toBeVisible();
    await expect(page.getByTestId("guest-preview")).toBeVisible();
  });

  test("save button gates behind sign-in modal", async ({ page }) => {
    await page.goto("/guest", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await page.getByRole("button", { name: /save \(sign in required\)/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/sign in to save/i)).toBeVisible();
    await page.getByRole("button", { name: /keep editing as guest/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("PDF download button gates behind sign-in modal", async ({ page }) => {
    await page.goto("/guest", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await page.getByRole("button", { name: /download pdf \(sign in required\)/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/download a real pdf/i)).toBeVisible();
  });

  test("guest quota endpoint responds", async ({ request }) => {
    const r = await request.get("/api/guest/quota");
    expect(r.status()).toBe(200);
    const j = (await r.json()) as { limit: number; used: number; remaining: number };
    expect(j.limit).toBeGreaterThan(0);
    expect(j.remaining).toBeGreaterThanOrEqual(0);
  });

  test("guest chat endpoint rejects empty payload", async ({ request }) => {
    const r = await request.post("/api/guest/chat", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(r.status()).toBe(400);
  });
});
