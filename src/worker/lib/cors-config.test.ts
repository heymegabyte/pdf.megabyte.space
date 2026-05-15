import { describe, expect, it } from "vitest";
import type { Context } from "hono";
import { corsOriginMatcher } from "./cors-config";
import type { Env } from "../types";

const ctx = (env: Partial<Env>): Context<{ Bindings: Env }> =>
  ({ env: env as Env }) as Context<{ Bindings: Env }>;

describe("corsOriginMatcher", () => {
  it("echoes the production origin", () => {
    expect(corsOriginMatcher("https://pdf.megabyte.space", ctx({}))).toBe(
      "https://pdf.megabyte.space"
    );
  });

  it("echoes the local Vite dev origin", () => {
    expect(corsOriginMatcher("http://localhost:5173", ctx({}))).toBe(
      "http://localhost:5173"
    );
  });

  it("echoes APP_URL when set (preview / alt domain)", () => {
    const preview = "https://pdf-preview.megabyte.space";
    expect(corsOriginMatcher(preview, ctx({ APP_URL: preview }))).toBe(preview);
  });

  it("returns null for unknown origins", () => {
    expect(corsOriginMatcher("https://evil.example", ctx({}))).toBeNull();
    expect(corsOriginMatcher("http://localhost:3000", ctx({}))).toBeNull();
  });

  it("returns null for protocol-mismatched origins", () => {
    expect(corsOriginMatcher("http://pdf.megabyte.space", ctx({}))).toBeNull();
  });

  it("handles missing APP_URL without falling back to wildcard", () => {
    expect(corsOriginMatcher("https://random.dev", ctx({}))).toBeNull();
  });

  it("does not echo empty string origin even if APP_URL is empty", () => {
    expect(corsOriginMatcher("", ctx({ APP_URL: "" }))).toBeNull();
  });
});
