import { chromium, devices } from "@playwright/test";

const BASE = process.env.SMOKE_URL || "https://pdf.megabyte.space";
const ROUTES = ["/", "/explore", "/sign-in"];
const BPS = [
  { name: "mobile-375", w: 375, h: 812 },
  { name: "mobile-390", w: 390, h: 844 },
  { name: "tablet-768", w: 768, h: 1024 },
  { name: "laptop-1024", w: 1024, h: 768 },
  { name: "desktop-1280", w: 1280, h: 800 },
  { name: "desktop-1920", w: 1920, h: 1080 },
];

const failures = [];
const titleByRoute = new Map();
const browser = await chromium.launch();
try {
  const REAL_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  for (const route of ROUTES) {
    const url = BASE + route;
    for (const bp of BPS) {
      const ctx = await browser.newContext({
        ...devices["Desktop Chrome"],
        userAgent: REAL_UA,
        viewport: { width: bp.w, height: bp.h },
        extraHTTPHeaders: {
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console: ${m.text()}`);
      });
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("load", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const status = resp?.status();
      const title = await page.title();
      const h1 = await page.locator("h1").first().textContent().catch(() => "");
      titleByRoute.set(route, title);
      console.log(`${route}\t${bp.name}\tHTTP ${status}\ttitle="${title}"\th1="${h1?.trim().slice(0, 60)}"`);
      if (status !== 200) failures.push(`${route} ${bp.name}: HTTP ${status}`);
      if (!h1) failures.push(`${route} ${bp.name}: missing h1`);
      if (errors.length) failures.push(`${route} ${bp.name}: ${errors.join(" | ")}`);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

const titles = [...titleByRoute.values()];
const uniq = new Set(titles);
if (titles.length !== uniq.size) {
  failures.push(`Duplicate titles: ${titles.join(" | ")}`);
}

if (failures.length) {
  console.error("FAILURES:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("All routes × breakpoints PASS");
