import { defineConfig, devices } from "@playwright/test";

const PROD_URL = process.env.PROD_URL ?? "https://pdf.megabyte.space";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: PROD_URL,
    trace: "on-first-retry",
    extraHTTPHeaders: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  },
  projects: [
    { name: "mobile-375", use: { ...devices["iPhone SE"], viewport: { width: 375, height: 667 } } },
    { name: "mobile-390", use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 } } },
    { name: "tablet-768", use: { ...devices["iPad Mini"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1024", use: { viewport: { width: 1024, height: 768 } } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 800 } } },
    { name: "wide-1920", use: { viewport: { width: 1920, height: 1080 } } },
  ],
});
