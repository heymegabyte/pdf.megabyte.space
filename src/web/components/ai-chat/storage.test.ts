import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAll,
  emptyStore,
  loadActiveId,
  loadStore,
  saveActiveId,
  saveStore,
  STORAGE_KEY,
} from "./storage";
import type { ThreadStore } from "./types";

function mockLocalStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i) => Array.from(data.keys())[i] ?? null,
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    setItem: (k, v) => {
      data.set(k, String(v));
    },
    removeItem: (k) => {
      data.delete(k);
    },
    clear: () => data.clear(),
  } as Storage;
}

beforeEach(() => {
  vi.stubGlobal("localStorage", mockLocalStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ai-chat / storage", () => {
  it("emptyStore is a valid schema-versioned shell", () => {
    const s = emptyStore();
    expect(s.threads).toEqual({});
    expect(s.order).toEqual([]);
    expect(s.schemaVersion).toBe(1);
  });

  it("loadStore returns emptyStore when no payload exists", () => {
    expect(loadStore()).toEqual(emptyStore());
  });

  it("loadStore tolerates corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{");
    expect(loadStore()).toEqual(emptyStore());
  });

  it("loadStore rejects v0/v1-style payloads with no schemaVersion", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads: {}, order: [] }));
    expect(loadStore()).toEqual(emptyStore());
  });

  it("round-trips a valid store", () => {
    const t: ThreadStore = {
      threads: {
        a: { id: "a", title: "Hello", messages: [], updatedAt: 1 },
      },
      order: ["a"],
      schemaVersion: 1,
    };
    saveStore(t);
    expect(loadStore()).toEqual(t);
  });

  it("active-id round-trips and clears", () => {
    saveActiveId("abc");
    expect(loadActiveId()).toBe("abc");
    saveActiveId(null);
    expect(loadActiveId()).toBeNull();
  });

  it("clearAll wipes both keys", () => {
    saveStore({ threads: {}, order: [], schemaVersion: 1 });
    saveActiveId("xyz");
    clearAll();
    expect(loadStore()).toEqual(emptyStore());
    expect(loadActiveId()).toBeNull();
  });
});
