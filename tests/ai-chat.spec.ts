import { test, expect } from "@playwright/test";

test.describe("AI Chat panel", () => {
  test("launcher button is visible on the homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Launcher fades in after a short delay
    await expect(page.locator(".aichat-launcher")).toBeVisible({ timeout: 5000 });
  });

  test("clicking the launcher opens the panel with composer focused", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();

    const panel = page.locator(".aichat-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("role", "dialog");

    // Textarea inside the composer is the focused element
    await expect(page.locator(".aichat-composer textarea")).toBeFocused();
  });

  test("typing / opens the slash menu", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();
    await page.locator(".aichat-composer textarea").fill("/he");
    await expect(page.locator(".aichat-slash")).toBeVisible();
    await expect(page.locator(".aichat-slash-list .aichat-slash-item").first()).toBeVisible();
  });

  test("Escape closes the panel and restores focus", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();
    await expect(page.locator(".aichat-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".aichat-panel")).toHaveCount(0);
  });
});

test.describe("AI Chat API", () => {
  test("/api/assistant/quota returns plan + limit + used", async ({ request }) => {
    const r = await request.get("/api/assistant/quota");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(typeof j.plan).toBe("string");
    expect(typeof j.limit).toBe("number");
    expect(typeof j.used).toBe("number");
    expect(typeof j.remaining).toBe("number");
  });

  test("/api/assistant/chat rejects empty messages array", async ({ request }) => {
    const r = await request.post("/api/assistant/chat", {
      data: { messages: [] },
    });
    expect(r.status()).toBe(400);
  });
});
