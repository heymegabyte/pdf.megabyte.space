import type { ThreadStore } from "./types";

const STORAGE_KEY = "mpdf.chat.threads.v2";
const ACTIVE_KEY = "mpdf.chat.active.v2";
const MAX_THREADS = 12;

/** New ThreadStore safe for first-time loads. */
export function emptyStore(): ThreadStore {
  return { threads: {}, order: [], schemaVersion: 1 };
}

/** Load + validate; tolerates stale, corrupt, or v1 payloads by resetting. */
export function loadStore(): ThreadStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<ThreadStore>;
    if (
      parsed &&
      parsed.threads &&
      typeof parsed.threads === "object" &&
      Array.isArray(parsed.order) &&
      parsed.schemaVersion === 1
    ) {
      // Trim to MAX_THREADS in case a previous build leaked extras.
      const order = parsed.order.slice(0, MAX_THREADS);
      const threads: ThreadStore["threads"] = {};
      for (const id of order) {
        const t = parsed.threads[id];
        if (t && typeof t === "object" && Array.isArray(t.messages)) {
          threads[id] = t;
        }
      }
      return { threads, order, schemaVersion: 1 };
    }
    return emptyStore();
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: ThreadStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // private mode / quota — non-fatal
  }
}

export function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export { STORAGE_KEY, ACTIVE_KEY, MAX_THREADS };
