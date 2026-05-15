import { describe, expect, it } from "vitest";

import { parsePrettierOutput } from "./ai-prettier";

describe("parsePrettierOutput", () => {
  it("extracts both fenced code blocks in canonical order", () => {
    const raw = [
      "```html",
      "<h1>Hello</h1>",
      "```",
      "",
      "```css",
      "h1 { color: red }",
      "```",
    ].join("\n");
    expect(parsePrettierOutput(raw)).toEqual({
      html: "<h1>Hello</h1>",
      css: "h1 { color: red }",
    });
  });

  it("returns null when neither block is present", () => {
    expect(parsePrettierOutput("just some prose, no code")).toBeNull();
    expect(parsePrettierOutput("")).toBeNull();
  });

  it("returns empty string for the missing language block", () => {
    const onlyHtml = ["```html", "<p>only html</p>", "```"].join("\n");
    expect(parsePrettierOutput(onlyHtml)).toEqual({
      html: "<p>only html</p>",
      css: "",
    });
    const onlyCss = ["```css", "p { color: blue }", "```"].join("\n");
    expect(parsePrettierOutput(onlyCss)).toEqual({
      html: "",
      css: "p { color: blue }",
    });
  });

  it("is case-insensitive on the language tag", () => {
    const raw = ["```HTML", "<p>x</p>", "```", "```CSS", "p{}", "```"].join("\n");
    expect(parsePrettierOutput(raw)).toEqual({ html: "<p>x</p>", css: "p{}" });
  });

  it("trims whitespace inside the blocks", () => {
    const raw = [
      "```html",
      "",
      "   <p>x</p>   ",
      "",
      "```",
      "```css",
      "  p {}  ",
      "```",
    ].join("\n");
    expect(parsePrettierOutput(raw)).toEqual({ html: "<p>x</p>", css: "p {}" });
  });

  it("ignores prose between blocks", () => {
    const raw = [
      "Here is the rewrite you asked for:",
      "```html",
      "<h1>Hi</h1>",
      "```",
      "And the CSS:",
      "```css",
      "h1 { font-weight: 700 }",
      "```",
      "Hope this helps.",
    ].join("\n");
    expect(parsePrettierOutput(raw)).toEqual({
      html: "<h1>Hi</h1>",
      css: "h1 { font-weight: 700 }",
    });
  });
});
