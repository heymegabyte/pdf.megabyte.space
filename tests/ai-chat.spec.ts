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

test.describe("AI Chat widgets (round 7)", () => {
  test("/podcast renders a card linking to /podcast and the RSS feed", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();
    const ta = page.locator(".aichat-composer textarea");
    await ta.fill("/podcast");
    await ta.press("Enter");

    const bot = page.locator(".aichat-msg.is-bot").last();
    await expect(bot).toBeVisible();
    await expect(bot.getByRole("link", { name: /Megabyte PDF — the show/i })).toHaveAttribute(
      "href",
      "/podcast"
    );
    await expect(bot.getByRole("link", { name: /RSS feed/i })).toHaveAttribute(
      "href",
      "/podcast/feed.xml"
    );
  });

  test("/features renders the capability grid with 4 items", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();
    const ta = page.locator(".aichat-composer textarea");
    await ta.fill("/features");
    await ta.press("Enter");

    const bot = page.locator(".aichat-msg.is-bot").last();
    await expect(bot.getByText("Prompt → PDF")).toBeVisible();
    await expect(bot.getByText("Live HTML/CSS editor")).toBeVisible();
    await expect(bot.getByText("Templates + community")).toBeVisible();
    await expect(bot.getByText("Real PDF export")).toBeVisible();
  });

  test("/support multi-choice routes a follow-up prompt", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();
    const ta = page.locator(".aichat-composer textarea");
    await ta.fill("/support");
    await ta.press("Enter");

    const bot = page.locator(".aichat-msg.is-bot").last();
    await expect(bot.getByText("What do you need?")).toBeVisible();

    // Clicking "Read the FAQ" sends /faq, which renders an faq widget.
    await bot.getByRole("button", { name: /Read the FAQ/i }).click();
    await expect(page.locator(".aichat-msg.is-user").last()).toContainText("/faq");
  });

  test("/newsletter renders the form with an email field + Subscribe button", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();
    const ta = page.locator(".aichat-composer textarea");
    await ta.fill("/newsletter");
    await ta.press("Enter");

    const bot = page.locator(".aichat-msg.is-bot").last();
    await expect(bot.locator('input[type="email"]')).toBeVisible();
    await expect(bot.getByRole("button", { name: /Subscribe/i })).toBeVisible();
  });

  test("/accessibility renders the WCAG checklist + a11y@ callout", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".aichat-launcher").click();
    const ta = page.locator(".aichat-composer textarea");
    await ta.fill("/accessibility");
    await ta.press("Enter");

    const bot = page.locator(".aichat-msg.is-bot").last();
    await expect(bot.getByText("Keyboard navigable")).toBeVisible();
    await expect(bot.getByText("AA contrast")).toBeVisible();
    await expect(bot.getByText(/a11y@megabyte\.space/)).toBeVisible();
  });

  test("before-after slider exposes a labelled range input", async ({ page }) => {
    // Render via the new-thread default flow → seed a before-after widget through
    // the local registry by typing /a11y first to verify the panel mounts, then
    // assert that any future before-after widget would carry the contract we
    // expect. (Today no command emits before-after; this test guards the
    // payload shape via a direct mount once one is wired up. Skip for now.)
    test.skip(true, "no /command emits before-after yet — add when wired");
    await page.goto("/", { waitUntil: "domcontentloaded" });
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
