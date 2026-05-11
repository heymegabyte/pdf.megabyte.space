import { chromium, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const URL = process.env.SMOKE_URL || "https://pdf.megabyte.space";
const OUT = path.resolve("smoke-screens");
fs.mkdirSync(OUT, { recursive: true });

const breakpoints = [
  { name: "mobile-375", w: 375, h: 812 },
  { name: "mobile-390", w: 390, h: 844 },
  { name: "tablet-768", w: 768, h: 1024 },
  { name: "laptop-1024", w: 1024, h: 768 },
  { name: "desktop-1280", w: 1280, h: 800 },
  { name: "desktop-1920", w: 1920, h: 1080 },
];

const failures = [];
const browser = await chromium.launch();
try {
  for (const bp of breakpoints) {
    const ctx = await browser.newContext({
      ...devices["Desktop Chrome"],
      viewport: { width: bp.w, height: bp.h },
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console: ${m.text()}`);
    });
    const resp = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("load", { timeout: 30000 }).catch(() => {});
    const status = resp?.status();
    await page.waitForTimeout(800);
    const title = await page.title();
    const h1 = await page.locator("h1").first().textContent().catch(() => "");
    const file = path.join(OUT, `${bp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${bp.name}\tHTTP ${status}\ttitle="${title}"\th1="${h1?.trim().slice(0, 80)}"`);
    if (status !== 200) failures.push(`${bp.name}: HTTP ${status}`);
    if (!h1) failures.push(`${bp.name}: missing h1`);
    if (errors.length) failures.push(`${bp.name}: ${errors.join(" | ")}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error("FAILURES:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("All breakpoints PASS");
