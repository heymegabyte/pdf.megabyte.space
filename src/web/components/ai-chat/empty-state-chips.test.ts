import { describe, expect, it } from "vitest";
import { chipsForPath } from "./empty-state-chips";
import { listCommandNames } from "./commands";

describe("ai-chat / empty-state chipsForPath", () => {
  it("returns the default chip set for the homepage", () => {
    const chips = chipsForPath("/");
    expect(chips.find((c) => c.cmd === "/pricing")).toBeDefined();
    expect(chips.find((c) => c.cmd === "/shortcommands")).toBeDefined();
  });

  it("returns editor-focused chips on /p/:id", () => {
    const chips = chipsForPath("/p/abc123");
    expect(chips.find((c) => c.cmd === "/improve")).toBeDefined();
    expect(chips.find((c) => c.cmd === "/summarize")).toBeDefined();
    expect(chips.find((c) => c.cmd === "/page-break")).toBeDefined();
  });

  it("returns dashboard-focused chips on /dashboard", () => {
    const chips = chipsForPath("/dashboard");
    expect(chips.find((c) => c.cmd === "/upgrade")).toBeDefined();
    expect(chips.find((c) => c.cmd === "/billing")).toBeDefined();
  });

  it("returns templates-focused chips under /templates and /pdf-template", () => {
    for (const p of ["/templates", "/templates/invoice", "/pdf-template/restaurant-menu"]) {
      const chips = chipsForPath(p);
      expect(chips.find((c) => c.cmd === "/invoice")).toBeDefined();
      expect(chips.find((c) => c.cmd === "/contract")).toBeDefined();
    }
  });

  it("returns explore-focused chips on /explore and /c/:slug", () => {
    for (const p of ["/explore", "/c/abc", "/t/invoice"]) {
      const chips = chipsForPath(p);
      expect(chips.find((c) => c.cmd === "/search")).toBeDefined();
    }
  });

  it("returns content-focused chips under /blog and /pdf-from-prompt", () => {
    for (const p of ["/blog", "/blog/hello", "/pdf-from-prompt", "/free-invoice-generator"]) {
      const chips = chipsForPath(p);
      expect(chips.find((c) => c.cmd === "/newsletter")).toBeDefined();
      expect(chips.find((c) => c.cmd === "/podcast")).toBeDefined();
    }
  });

  it("falls back to defaults for unknown paths", () => {
    const chips = chipsForPath("/some/unknown/route");
    expect(chips).toEqual(chipsForPath("/"));
  });

  it("handles undefined path gracefully", () => {
    const chips = chipsForPath(undefined);
    expect(chips.length).toBeGreaterThan(0);
  });

  it("never references a command outside the registry", () => {
    const known = new Set(listCommandNames());
    const allPaths = [
      "/",
      "/p/abc",
      "/dashboard",
      "/templates",
      "/pdf-template/x",
      "/explore",
      "/c/abc",
      "/blog",
      "/podcast",
      "/sign-in",
      "/guest",
      "/anything-else",
    ];
    for (const p of allPaths) {
      for (const c of chipsForPath(p)) {
        expect(known.has(c.cmd), `${p} chip ${c.cmd} missing from registry`).toBe(true);
      }
    }
  });

  it("returns 4-6 chips per path (layout floor + ceiling)", () => {
    const paths = ["/", "/p/x", "/dashboard", "/templates", "/explore", "/blog", "/sign-in", "/guest", "/x"];
    for (const p of paths) {
      const n = chipsForPath(p).length;
      expect(n, p).toBeGreaterThanOrEqual(4);
      expect(n, p).toBeLessThanOrEqual(6);
    }
  });
});
