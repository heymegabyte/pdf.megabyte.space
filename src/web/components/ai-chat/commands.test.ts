import { describe, expect, it } from "vitest";
import { COMMANDS, filterCommands, listCommandNames, parseSlash } from "./commands";

describe("ai-chat / commands registry", () => {
  it("registers at least the core help, pricing, and clear commands", () => {
    const names = listCommandNames();
    expect(names).toContain("/help");
    expect(names).toContain("/pricing");
    expect(names).toContain("/clear");
  });

  it("has unique command names", () => {
    const names = listCommandNames();
    expect(new Set(names).size).toBe(names.length);
  });

  it("every command has a non-empty name starting with /", () => {
    for (const c of COMMANDS) {
      expect(c.name.startsWith("/")).toBe(true);
      expect(c.name.length).toBeGreaterThan(1);
      expect(c.description.length).toBeGreaterThan(0);
    }
  });

  it("registers the round-6 additions: /search /status /changelog /share /shortcuts", () => {
    const names = listCommandNames();
    for (const n of ["/search", "/status", "/changelog", "/share", "/shortcuts"]) {
      expect(names).toContain(n);
    }
  });

  it("registers the round-7 additions: /newsletter /podcast /features /accessibility /support", () => {
    const names = listCommandNames();
    for (const n of ["/newsletter", "/podcast", "/features", "/accessibility", "/support"]) {
      expect(names).toContain(n);
    }
  });

  it("aliases resolve to the same command record", () => {
    expect(parseSlash("/find")?.command.name).toBe("/search");
    expect(parseSlash("/keyboard")?.command.name).toBe("/shortcuts");
    expect(parseSlash("/whatsnew")?.command.name).toBe("/changelog");
    expect(parseSlash("/health")?.command.name).toBe("/status");
    expect(parseSlash("/subscribe")?.command.name).toBe("/newsletter");
    expect(parseSlash("/listen")?.command.name).toBe("/podcast");
    expect(parseSlash("/a11y")?.command.name).toBe("/accessibility");
    expect(parseSlash("/help-me")?.command.name).toBe("/support");
  });

  it("every widget command produces non-empty widget output", () => {
    for (const c of COMMANDS) {
      if (c.kind === "widget") {
        const w = c.getWidgets();
        expect(Array.isArray(w)).toBe(true);
        expect(w.length).toBeGreaterThan(0);
        for (const widget of w) {
          expect(typeof widget.kind).toBe("string");
          expect(widget.payload).toBeDefined();
        }
      }
    }
  });
});

describe("ai-chat / parseSlash", () => {
  it("returns null for plain text", () => {
    expect(parseSlash("hello world")).toBeNull();
  });

  it("matches a known slash command and trims args", () => {
    const r = parseSlash("/pricing  monthly  ");
    expect(r).not.toBeNull();
    expect(r?.command.name).toBe("/pricing");
    expect(r?.args).toBe("monthly");
  });

  it("is case-insensitive on the head", () => {
    const r = parseSlash("/HELP");
    expect(r?.command.name).toBe("/help");
  });

  it("returns null for an unregistered command", () => {
    expect(parseSlash("/totally-fake-command")).toBeNull();
  });
});

describe("ai-chat / filterCommands", () => {
  it("returns nothing for empty or non-slash queries", () => {
    expect(filterCommands("")).toEqual([]);
    expect(filterCommands("hello")).toEqual([]);
  });

  it("returns commands that start with the query", () => {
    const r = filterCommands("/p");
    expect(r.length).toBeGreaterThan(0);
    for (const c of r) {
      const matches =
        c.name.startsWith("/p") || (c.aliases ?? []).some((a) => a.startsWith("/p"));
      expect(matches).toBe(true);
    }
  });

  it("respects the limit param", () => {
    const r = filterCommands("/", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});
