import { describe, expect, it } from "vitest";
import { xmlEscape, svgEscape, wrapWords } from "./xml-utils";

describe("xmlEscape", () => {
  it("escapes the five XML metacharacters", () => {
    expect(xmlEscape("<a>&\"'")).toBe("&lt;a&gt;&amp;&quot;&apos;");
  });

  it("leaves benign text untouched", () => {
    expect(xmlEscape("hello world 123")).toBe("hello world 123");
  });

  it("handles empty strings", () => {
    expect(xmlEscape("")).toBe("");
  });

  it("escapes attribute-injection attempts", () => {
    expect(xmlEscape('"><script>')).toBe("&quot;&gt;&lt;script&gt;");
  });
});

describe("svgEscape", () => {
  it("is a direct alias of xmlEscape", () => {
    expect(svgEscape).toBe(xmlEscape);
  });
});

describe("wrapWords", () => {
  it("packs short text onto a single line", () => {
    expect(wrapWords("hello world", 20, 3)).toEqual(["hello world"]);
  });

  it("wraps to multiple lines when text exceeds maxChars", () => {
    const lines = wrapWords("the quick brown fox jumps over lazy", 12, 3);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((l) => l.length <= 12)).toBe(true);
  });

  it("truncates with an ellipsis on the final line when text overflows maxLines", () => {
    const lines = wrapWords(
      "one two three four five six seven eight nine ten eleven",
      8,
      2
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/…$/);
  });

  it("collapses repeated whitespace", () => {
    expect(wrapWords("a    b    c", 20, 2)).toEqual(["a b c"]);
  });

  it("returns empty array for empty input", () => {
    expect(wrapWords("", 10, 3)).toEqual([]);
  });
});
