import { describe, expect, it } from "vitest";
import { escapeHtml, isSafeUrl, renderMarkdown } from "./markdown";

describe("ai-chat / escapeHtml", () => {
  it("escapes the canonical HTML metacharacters", () => {
    expect(escapeHtml(`<script>alert("xss")&'`)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&amp;&#39;"
    );
  });

  it("returns an empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("ai-chat / isSafeUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(isSafeUrl("https://pdf.megabyte.space/pricing")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("rejects dangerous schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("mailto:hey@megabyte.space")).toBe(false);
  });

  it("rejects relative URLs and garbage", () => {
    expect(isSafeUrl("/pricing")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});

describe("ai-chat / renderMarkdown", () => {
  it("escapes script tags in plain prose", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders bold + italic + inline code", () => {
    const html = renderMarkdown("**bold** and *italic* and `code`");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain('<code class="inline">code</code>');
  });

  it("renders fenced code blocks with language attribute", () => {
    const html = renderMarkdown("```html\n<div>hi</div>\n```");
    expect(html).toContain('data-lang="html"');
    expect(html).toContain("&lt;div&gt;hi&lt;/div&gt;");
  });

  it("renders safe http(s) links as anchors", () => {
    const html = renderMarkdown("see [docs](https://pdf.megabyte.space)");
    expect(html).toContain('href="https://pdf.megabyte.space"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("does NOT render javascript: links as anchors (only as plain text)", () => {
    const html = renderMarkdown("click [me](javascript:alert(1))");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('href="javascript:');
  });

  it("renders bullet lists", () => {
    const html = renderMarkdown("- one\n- two\n- three");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>three</li>");
  });
});
