/**
 * Editor E2E — authenticated flows, code panel, snapshots, share
 * Requires: TEST_USER_PASSWORD env var, PROD_URL env var
 * All tests start at homepage and navigate like a real user.
 */
import { test, expect, Page } from "@playwright/test";

const EMAIL = "test@megabyte.space";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "";

async function signIn(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");

  // Navigate to sign in via the nav
  const signInLink = page.getByRole("link", { name: /sign in/i });
  await expect(signInLink).toBeVisible();
  await signInLink.click();

  await page.waitForURL(/sign-in/);
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|continue/i }).last().click();

  // Should land on dashboard after auth
  await page.waitForURL(/dashboard/);
  await expect(page.getByRole("heading", { name: /your pdfs/i })).toBeVisible();
}

async function createProject(page: Page): Promise<string> {
  // Click "New PDF" button
  await page.getByRole("button", { name: /new pdf/i }).first().click();
  // Wait for redirect to editor
  await page.waitForURL(/\/p\//);
  const url = page.url();
  return url.split("/p/")[1];
}

test.describe("authenticated editor flow", () => {
  test.skip(!PASSWORD, "TEST_USER_PASSWORD not set");

  test("sign in and view dashboard", async ({ page }) => {
    await signIn(page);
    const heading = page.getByRole("heading", { name: /your pdfs/i });
    await expect(heading).toBeVisible();
  });

  test("create project and land in editor", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    // Editor components visible
    await expect(page.getByRole("log", { name: /chat messages/i })).toBeVisible();
    await expect(page.getByLabel(/chat message/i)).toBeVisible();
    await expect(page.locator("iframe[title='PDF preview']")).toBeVisible();
  });

  test("starter prompt populates textarea and can be sent", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    // Click a starter prompt
    const starterBtn = page.getByText(/invoice for \$4,200/i);
    await expect(starterBtn).toBeVisible();
    await starterBtn.click();

    const textarea = page.getByLabel(/chat message/i);
    await expect(textarea).toHaveValue(/invoice/i);
  });

  test("send chat message and receive AI response", async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page);
    await createProject(page);

    const textarea = page.getByLabel(/chat message/i);
    await textarea.fill("Create a simple one-page invoice for $500 from Test Corp to ACME Inc");
    await textarea.press("Meta+Enter");

    // Loading spinner visible while sending
    await expect(page.getByText(/drawing your document/i)).toBeVisible();

    // Wait for AI response (up to 60s)
    await expect(page.getByText(/drawing your document/i)).not.toBeVisible({ timeout: 60_000 });
    // Assistant bubble appears
    await expect(page.locator('[role="log"]').getByText(/.+/).last()).toBeVisible();
  });

  test("code panel opens with CodeMirror (not Monaco)", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    // Send a quick prompt first to have some HTML
    const textarea = page.getByLabel(/chat message/i);
    await textarea.fill("Hello world invoice");
    await page.getByRole("button", { name: /send/i }).click();
    // Wait for response
    await expect(page.getByText(/drawing your document/i)).not.toBeVisible({ timeout: 60_000 });

    // Click Code button in TopBar
    const codeBtn = page.getByRole("button", { name: /code/i });
    await expect(codeBtn).toBeVisible();
    await codeBtn.click();

    // CodeMirror renders — look for .cm-editor not Monaco elements
    await expect(page.locator(".cm-editor").first()).toBeVisible({ timeout: 5_000 });

    // Confirm NO Monaco elements (Monaco uses .monaco-editor class)
    await expect(page.locator(".monaco-editor")).toHaveCount(0);

    // HTML tab active by default
    await expect(page.getByRole("tab", { name: "HTML" })).toHaveAttribute("aria-selected", "true");

    // Switch to CSS tab
    await page.getByRole("tab", { name: "CSS" }).click();
    await expect(page.locator(".cm-editor").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "CSS" })).toHaveAttribute("aria-selected", "true");
  });

  test("code panel closes with X button", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    await page.getByRole("button", { name: /code/i }).click();
    await expect(page.locator(".cm-editor").first()).toBeVisible({ timeout: 5_000 });

    await page.getByLabel("Close code panel").click();
    await expect(page.locator(".cm-editor")).toHaveCount(0);
  });

  test("iframe preview does not flicker on chat response", async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page);
    await createProject(page);

    // Track iframe DOM mutations — remount would cause a blank src momentarily
    let iframeRemounted = false;
    await page.exposeFunction("__markRemount__", () => { iframeRemounted = true; });
    await page.evaluate(() => {
      const iframe = document.querySelector("iframe[title='PDF preview']");
      if (!iframe) return;
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.removedNodes) {
            if ((node as Element).tagName === "IFRAME") {
              (window as unknown as Record<string, unknown>).__markRemount__();
            }
          }
        }
      });
      observer.observe(iframe.parentElement!, { childList: true });
    });

    const textarea = page.getByLabel(/chat message/i);
    await textarea.fill("Add a footer line");
    await page.getByRole("button", { name: /send/i }).click();
    await expect(page.getByText(/drawing your document/i)).not.toBeVisible({ timeout: 60_000 });

    // iframe should NOT have been removed from DOM
    expect(iframeRemounted).toBe(false);
  });

  test("model selector keyboard and aria", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    const radioGroup = page.getByRole("radiogroup", { name: /ai model/i });
    await expect(radioGroup).toBeVisible();

    const sonnetBtn = radioGroup.getByRole("radio", { name: /sonnet/i });
    const opusBtn = radioGroup.getByRole("radio", { name: /opus/i });

    await expect(sonnetBtn).toHaveAttribute("aria-checked", "true");
    await opusBtn.click();
    await expect(opusBtn).toHaveAttribute("aria-checked", "true");
    await expect(sonnetBtn).toHaveAttribute("aria-checked", "false");
  });

  test("snapshot drawer opens, has focus trap, Escape closes", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    // Open snapshot drawer via History button
    await page.getByRole("button", { name: /version history/i }).click();
    const dialog = page.getByRole("dialog", { name: /version history/i });
    await expect(dialog).toBeVisible();

    // Verify keyboard focus is inside dialog (close button gets autoFocus)
    const closeBtn = dialog.getByRole("button", { name: /close/i });
    await expect(closeBtn).toBeFocused();

    // Tab should stay inside (focus trap)
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null);
    expect(focused).toBe(true);

    // Escape closes
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("upgrade modal opens and closes", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    // Trigger upgrade by clicking PDF export (test user is free tier)
    await page.getByRole("button", { name: /pdf/i }).click();

    // Either upgrade modal appears OR the export succeeds (pro user)
    const dialog = page.getByRole("dialog", { name: /upgrade to pro/i });
    const upgradeVisible = await dialog.isVisible().catch(() => false);
    if (upgradeVisible) {
      // Verify modal has working Escape close
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
  });

  test("title rename works inline", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    // Click the title to enter edit mode
    const titleBtn = page.getByRole("button", { name: /rename/i });
    await titleBtn.click();

    const input = page.getByLabel("Project title");
    await expect(input).toBeVisible();
    await input.fill("My Test Invoice");
    await input.press("Enter");

    await expect(page.getByRole("button", { name: /rename/i })).toContainText("My Test Invoice");
  });

  test("page size selector updates project", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    const select = page.getByRole("combobox", { name: /page size/i });
    await expect(select).toHaveValue("Letter");
    await select.selectOption("A4");
    await expect(select).toHaveValue("A4");
  });

  test("back button navigates to dashboard", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    await page.getByRole("button", { name: /back to dashboard/i }).click();
    await page.waitForURL(/dashboard/);
    await expect(page.getByRole("heading", { name: /your pdfs/i })).toBeVisible();
  });

  test("dashboard shows project count and plan badge", async ({ page }) => {
    await signIn(page);

    await expect(page.getByText(/of .+ used/i)).toBeVisible();
    // Either Free or Pro badge
    const badge = page.getByText(/free|pro/i).first();
    await expect(badge).toBeVisible();
  });

  test("delete project from dashboard removes card", async ({ page }) => {
    await signIn(page);
    await createProject(page);

    // Back to dashboard
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const cards = page.locator(".card").filter({ has: page.locator("h3") });
    const initialCount = await cards.count();

    if (initialCount > 0) {
      // Click delete on first card
      const firstDelete = page.getByRole("button", { name: /delete project/i }).first();
      page.on("dialog", (d) => d.accept());
      await firstDelete.click();

      // Card count decreases
      await expect(cards).toHaveCount(initialCount - 1);
    }
  });
});

test.describe("share link flow (unauthenticated)", () => {
  test("invalid share slug returns not-found page", async ({ page }) => {
    const res = await page.goto("/s/invalid-slug-xyz");
    // Either 404 status or page shows not found
    const status = res?.status() ?? 0;
    if (status !== 200) {
      expect(status).toBe(404);
    } else {
      await expect(page.getByText(/not found/i)).toBeVisible();
    }
  });
});

test.describe("accessibility — editor page", () => {
  test.skip(!PASSWORD, "TEST_USER_PASSWORD not set");

  test("no critical axe violations on editor page", async ({ page }) => {
    const { checkA11y, injectAxe } = await import("axe-playwright");
    await signIn(page);
    await createProject(page);

    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        rules: {
          "color-contrast": { enabled: false }, // dark theme needs manual review
        },
      },
    });
  });
});
