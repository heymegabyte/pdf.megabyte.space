# Testing

Three test layers, each with a different job. Run all three before you ship anything user-visible.

## Layer summary

| Layer    | Tool                  | Scope                                    | Where it runs               |
| -------- | --------------------- | ---------------------------------------- | --------------------------- |
| Unit     | Vitest 4              | Pure functions, parsers, formatters      | Node, in-process            |
| E2E      | Playwright 1.59       | Full request → render path, 6 viewports  | Chromium against PROD_URL   |
| A11y     | Playwright + axe-core | WCAG 2.2 AA on landing + guest editor    | Chromium against PROD_URL   |
| Smoke    | `scripts/smoke.mjs`   | Quick post-deploy sanity at 6 breakpoints | Local Chromium against any URL |

## Commands

```bash
npm test                  # vitest run (unit)
npm run test:watch        # vitest watch
npm run test:e2e          # playwright test (defaults to https://pdf.megabyte.space)
PROD_URL=http://localhost:5173 npm run test:e2e  # point at local dev
SMOKE_URL=https://pdf.megabyte.space node scripts/smoke.mjs   # post-deploy smoke
```

## Unit tests (Vitest)

**Config** — `vitest.config.ts`:

```ts
{
  include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  exclude: ["node_modules/**", "dist/**", "tests/**", ".playwright-mcp/**"],
  environment: "node",
}
```

E2E lives under `tests/`; that's excluded from the Vitest sweep so the two suites can't cross-contaminate.

### What belongs here

Pure functions with no Cloudflare runtime dependency. Current examples:

- `src/worker/lib/ai-meta.test.ts` — Claude response parser. Validates the model's JSON output is normalised, capped, and rejected when malformed.

### What does **not** belong here

- Anything that needs `c.env` bindings — D1, R2, KV. Use Playwright or test the route end-to-end.
- DOM rendering. We don't ship `jsdom`. If you need DOM, write a Playwright test.
- Anything that makes real network calls. Mock or skip.

### Writing a new unit test

```ts
import { describe, it, expect } from "vitest";
import { fnUnderTest } from "./module";

describe("fnUnderTest", () => {
  it("handles the happy path", () => {
    expect(fnUnderTest(input)).toBe(expected);
  });

  it("returns null on malformed input", () => {
    expect(fnUnderTest("garbage")).toBeNull();
  });
});
```

Cover at minimum: happy path, edge boundary, malformed input, empty input. The `parseJson()` tests in `ai-meta.test.ts` are a good template — every branch in the function has at least one test.

### Conventions

- File name: `<module>.test.ts` next to `<module>.ts`. Co-locating tests keeps them discoverable.
- One `describe` per exported function; one `it` per behaviour.
- No global setup files. If a test needs a fixture, inline it.

## E2E tests (Playwright)

**Config** — `playwright.config.ts`:

- Test dir: `./tests`
- `fullyParallel: true` — every test must be independent
- 6 projects matching the breakpoint matrix: 375 / 390 / 768 / 1024 / 1280 / 1920
- Realistic Chrome UA on every request (Cloudflare Bot Management blocks default Playwright UA)
- `PROD_URL` env var sets `baseURL`. Defaults to `https://pdf.megabyte.space`.
- `retries: 2` in CI, `0` locally (catches flakes before merge).

### Suites

| File                  | What it covers                                                              |
| --------------------- | --------------------------------------------------------------------------- |
| `smoke.spec.ts`       | Homepage loads, critical meta tags present, asset gate (22 files), `/api/health` |
| `editor.spec.ts`      | Full editor flow: sign in → create project → edit HTML → render PDF → export    |
| `guest.spec.ts`       | Anonymous guest editor flow (no auth required)                              |
| `billing.spec.ts`     | Stripe checkout session creation + webhook idempotency                      |
| `a11y-audit.spec.ts`  | axe-core 0 violations on landing + guest editor                             |

### Writing a new E2E test

Start with a failing test that emulates a real user. **Always start at the homepage and click through** — never `page.goto()` directly into a deep route, that bypasses navigation bugs.

```ts
import { test, expect } from "@playwright/test";

test("user can publish a project from the editor", async ({ page }) => {
  // 1. Land on homepage
  await page.goto("/");
  await expect(page).toHaveTitle(/Megabyte PDF/);

  // 2. Sign in via Google (test account)
  await page.getByRole("link", { name: /sign in/i }).click();
  // ... OAuth flow ...

  // 3. Navigate to editor
  await page.getByRole("link", { name: /new project/i }).click();

  // 4. Interact
  await page.getByLabel("Title").fill("Test report");
  await page.getByRole("button", { name: /publish/i }).click();

  // 5. Verify
  await expect(page.getByText(/published/i)).toBeVisible();
});
```

### Selector priority

1. `page.getByRole("button", { name: ... })` — semantic, survives styling changes
2. `page.getByLabel(...)` — for form fields
3. `page.getByText(...)` — for unique copy
4. `page.locator('[data-testid="..."]')` — last resort, add `data-testid` only when nothing semantic works

Avoid CSS class selectors. Tailwind class names churn; a test referencing `.bg-blue-500` breaks the moment you bump a colour.

### Asset existence gate

`smoke.spec.ts` iterates over a hard-coded list of public assets (favicons, manifest, robots, sitemap, sw.js, screenshots) and asserts every one returns 200. Adding a new asset → add it to the `ASSETS` array. Removing one → drop the entry. Production has shipped 404s for things like `/maskable-512x512.png` before this gate existed.

### Test account

Sign-in flows use `test@megabyte.space` with `TEST_USER_PASSWORD` (env var, not in `.dev.vars`). The test account has Pro plan permissions so it can render unlimited PDFs without hitting free-tier quotas.

### Flake control

If a test fails intermittently:

1. **First, suspect timing.** Replace `waitForTimeout` with `waitFor` / `toBeVisible()` / `waitForResponse()`. Never sleep.
2. **Check for cross-test state.** A leaked session cookie or DB row from a previous test breaks `fullyParallel`. Each test should clean up its own writes.
3. **Run Playwright's Healer** (1.59+) — automatically suggests selector fixes when the DOM has shifted.
4. **Only then add `test.fixme()`** and open a ticket. Never leave flaky tests passing-with-retries silently.

## Accessibility audit

`tests/a11y-audit.spec.ts` injects axe-core 4.11.3 from CDN, runs it against landing + guest editor at 1280px, asserts zero WCAG 2.2 AA violations.

Run as part of `npm run test:e2e`. CI gates merges on zero violations.

### When to add a new page

Copy the existing block:

```ts
test("dashboard 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
  await page.goto("https://pdf.megabyte.space/dashboard");
  // sign in if needed
  await page.waitForLoadState("networkidle");
  const violations = await runAxe(page);
  reportViolations("pdf.megabyte.space/dashboard", violations);
  expect(violations).toHaveLength(0);
});
```

Auth-gated pages need a sign-in step before `runAxe()`.

### Known false positives

axe-core occasionally flags Tailwind utility colour combos that ARE compliant when computed against the actual DOM background. If you hit one, verify with a manual contrast check (`getComputedStyle().backgroundColor` chained up the ancestor tree) before excluding the rule. Never blanket-disable a rule — exclude by selector, document why.

## Post-deploy smoke

`scripts/smoke.mjs` is the fastest possible "did production survive the deploy" check. Runs locally against any URL:

```bash
SMOKE_URL=https://pdf.megabyte.space node scripts/smoke.mjs
```

What it does:

1. Launches headless Chromium.
2. For each of 6 breakpoints: navigates, waits for `domcontentloaded` + `load`, captures full-page screenshot to `smoke-screens/<bp>.png`.
3. Prints HTTP status, page title, first `<h1>` text per viewport.
4. Fails (exit 1) if any viewport: non-200, missing `<h1>`, or had `pageerror` / console-error events.

Screenshots survive in `smoke-screens/` for visual review. Diff against a known-good directory if you want a poor-man's visual regression suite.

`scripts/smoke-multi.mjs` is the multi-route variant — feeds the same browser through `/`, `/dashboard`, `/explore`, `/c/<sample-slug>` and asserts each one.

## Coverage targets

- **Unit:** every exported function in `src/worker/lib/` that has branching logic. Pure parsers, formatters, validators — all of these get a `.test.ts`.
- **E2E:** every state-changing user flow at least once. Read-only flows once per page type.
- **A11y:** every public page (no auth required to view) at 1280px minimum. Internal pages once per role.

We don't enforce a numeric coverage percentage — the metric is "every PR adds a test for the behaviour it adds." Look at the diff: if it added a function, look for the matching test. If not, push back in review.

## TDD doctrine

When the task is "fix a bug":

1. Write a Playwright test against `PROD_URL=http://localhost:5173` that reproduces the bug. Confirm it fails.
2. Fix the bug in the smallest possible diff.
3. Re-run. The test should pass. No other test should regress.
4. Commit the test + fix together.

When the task is "add a feature":

1. Write the failing E2E test that describes the user-visible behaviour.
2. Implement until the test passes.
3. Add unit tests for any pure helpers introduced along the way.

Don't write tests after the code lands "to backfill coverage." They're load-bearing during development, not a chore at the end.

## CI integration

GitHub Actions runs on every PR:

```yaml
- npm ci
- npm run typecheck
- npm run lint
- npm test
- npm run build
- npm run test:e2e   # against ephemeral preview deploy
```

Any one failing blocks merge. The order matters: typecheck catches the cheapest class of bug first, then lint, then unit, then build, then E2E (slowest). Fail-fast saves CI minutes.

## Local-vs-prod parity

E2E tests pass against both `http://localhost:5173` (Vite + Wrangler) and `https://pdf.megabyte.space`. If a test passes locally but fails in CI:

- **CSP** — production has a stricter CSP than dev (no localhost in `connect-src`). Check the browser console.
- **D1 state** — dev DB has seed data, production doesn't. Tests must create their own fixtures.
- **OAuth redirect URI** — Google OAuth allow-list must include both `http://localhost:5173/api/auth/callback` and the prod equivalent.
- **Listmonk** — local dev points at the production Listmonk by default (intentional). If you mocked it locally, you can't have done so in CI.

When in doubt, run `PROD_URL=https://pdf.megabyte.space npm run test:e2e` locally and watch the failure live.
