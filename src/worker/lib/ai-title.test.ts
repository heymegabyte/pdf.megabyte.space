import { describe, expect, it } from "vitest";

import { cleanTitle } from "./ai-title";

describe("cleanTitle", () => {
  it("trims surrounding whitespace", () => {
    expect(cleanTitle("  Hello World  ")).toBe("Hello World");
  });

  it("strips surrounding quotes and decoration", () => {
    expect(cleanTitle('"Quoted Title"')).toBe("Quoted Title");
    expect(cleanTitle("'Single Quotes'")).toBe("Single Quotes");
    expect(cleanTitle("`Backticked`")).toBe("Backticked");
    expect(cleanTitle("**Bold**")).toBe("Bold");
    expect(cleanTitle("__Underscored__")).toBe("Underscored");
  });

  it("strips Title:/Document:/PDF: prefixes case-insensitively", () => {
    expect(cleanTitle("Title: Annual Report")).toBe("Annual Report");
    expect(cleanTitle("document: Annual Report")).toBe("Annual Report");
    expect(cleanTitle("PDF: Annual Report")).toBe("Annual Report");
  });

  it("collapses internal whitespace", () => {
    expect(cleanTitle("Hello   \t  World")).toBe("Hello World");
  });

  it("truncates to 60 chars with ellipsis when over", () => {
    const long = "A".repeat(80);
    const out = cleanTitle(long);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith("…")).toBe(true);
  });

  it("does not truncate at or below 60 chars", () => {
    const ok = "A".repeat(60);
    expect(cleanTitle(ok)).toBe(ok);
  });

  it("handles empty / whitespace / nullish input", () => {
    expect(cleanTitle("")).toBe("");
    expect(cleanTitle("   ")).toBe("");
    expect(cleanTitle(undefined as unknown as string)).toBe("");
  });

  it("composes: prefix + truncation in one pass", () => {
    const messy = "  Title:   " + "X".repeat(80) + "  ";
    const out = cleanTitle(messy);
    expect(out.startsWith("X")).toBe(true);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(60);
  });
});
