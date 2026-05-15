import { describe, expect, it } from "vitest";
import { isUserRenderPath } from "./security-headers";

describe("isUserRenderPath", () => {
  it("matches the public /s/:slug/render route", () => {
    expect(isUserRenderPath("/s/abc123/render")).toBe(true);
    expect(isUserRenderPath("/s/some-uuid-v4/render")).toBe(true);
  });

  it("matches the /api/public/:slug/render route", () => {
    expect(isUserRenderPath("/api/public/xyz/render")).toBe(true);
    expect(isUserRenderPath("/api/public/01HXYZ/render")).toBe(true);
  });

  it("rejects non-render endpoints on the same prefixes", () => {
    expect(isUserRenderPath("/api/public/xyz/meta")).toBe(false);
    expect(isUserRenderPath("/s/abc/meta")).toBe(false);
    expect(isUserRenderPath("/api/public/xyz")).toBe(false);
    expect(isUserRenderPath("/s/abc")).toBe(false);
  });

  it("rejects routes with extra path segments after /render", () => {
    expect(isUserRenderPath("/s/abc/render/extra")).toBe(false);
    expect(isUserRenderPath("/api/public/xyz/render/page")).toBe(false);
  });

  it("rejects empty slugs", () => {
    expect(isUserRenderPath("/s//render")).toBe(false);
    expect(isUserRenderPath("/api/public//render")).toBe(false);
  });

  it("rejects unrelated paths", () => {
    expect(isUserRenderPath("/")).toBe(false);
    expect(isUserRenderPath("/render")).toBe(false);
    expect(isUserRenderPath("/api/public/")).toBe(false);
    expect(isUserRenderPath("/api/projects/abc")).toBe(false);
    expect(isUserRenderPath("/sitemap.xml")).toBe(false);
  });
});
