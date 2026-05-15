import { describe, expect, it } from "vitest";

import { extractSection, ALLOWED_BLOCK_KINDS } from "./ai-block";

describe("extractSection", () => {
  it("returns the first <section> element verbatim", () => {
    const raw = '<section class="cover"><h1>Hi</h1></section>';
    expect(extractSection(raw)).toBe(raw);
  });

  it("strips a leading ```html fence", () => {
    const raw = "```html\n<section><p>x</p></section>\n```";
    expect(extractSection(raw)).toBe("<section><p>x</p></section>");
  });

  it("strips a bare ``` fence", () => {
    const raw = "```\n<section><p>x</p></section>\n```";
    expect(extractSection(raw)).toBe("<section><p>x</p></section>");
  });

  it("returns null when no <section> is present", () => {
    expect(extractSection("just text, no section")).toBeNull();
    expect(extractSection("<div>not a section</div>")).toBeNull();
    expect(extractSection("")).toBeNull();
  });

  it("ignores prose before/after the section", () => {
    const raw = "Sure — here it is:\n<section><h2>Hi</h2></section>\nHope that works!";
    expect(extractSection(raw)).toBe("<section><h2>Hi</h2></section>");
  });

  it("is case-insensitive on the section tag", () => {
    expect(extractSection("<SECTION><P>X</P></SECTION>")).toBe("<SECTION><P>X</P></SECTION>");
  });

  it("matches the FIRST section if multiple are present", () => {
    const raw = "<section>one</section><section>two</section>";
    expect(extractSection(raw)).toBe("<section>one</section>");
  });
});

describe("ALLOWED_BLOCK_KINDS", () => {
  it("matches the canonical 8-kind list", () => {
    expect(ALLOWED_BLOCK_KINDS).toEqual([
      "cover",
      "toc",
      "signature",
      "references",
      "cta",
      "executive-summary",
      "thank-you",
      "divider",
    ]);
  });
});
