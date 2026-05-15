import { useEffect, useState } from "react";
import type { PageContext } from "./types";

const MAX_HEADINGS = 8;
const MAX_HEADING_LEN = 120;
const MAX_SELECTION_LEN = 2000;

function gatherHeadings(): string[] {
  if (typeof document === "undefined") return [];
  const nodes = document.querySelectorAll("h1, h2, h3");
  const out: string[] = [];
  for (const n of Array.from(nodes)) {
    const t = (n.textContent || "").trim().replace(/\s+/g, " ");
    if (!t) continue;
    out.push(t.slice(0, MAX_HEADING_LEN));
    if (out.length >= MAX_HEADINGS) break;
  }
  return out;
}

function gatherSelection(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const sel = window.getSelection?.();
  const text = sel?.toString().trim();
  if (!text) return undefined;
  return text.length > MAX_SELECTION_LEN ? text.slice(0, MAX_SELECTION_LEN) : text;
}

function gatherSummary(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  const desc = meta?.content?.trim();
  if (desc) return desc.slice(0, 280);
  return undefined;
}

function snapshot(): PageContext {
  return {
    path: typeof location !== "undefined" ? location.pathname : undefined,
    title: typeof document !== "undefined" ? document.title : undefined,
    summary: gatherSummary(),
    headings: gatherHeadings(),
    selection: gatherSelection(),
  };
}

/**
 * Reactively snapshots route + title + headings + selection so the AI grounds
 * its answers on what the user is looking at right now. Selection updates on
 * every `selectionchange`; path/title on pushState + popstate.
 */
export function usePageContext(): PageContext {
  const [ctx, setCtx] = useState<PageContext>(() => snapshot());

  useEffect(() => {
    const refresh = () => setCtx(snapshot());
    const onSelection = () => setCtx((c) => ({ ...c, selection: gatherSelection() }));

    window.addEventListener("popstate", refresh);
    document.addEventListener("selectionchange", onSelection);

    // Wrap pushState/replaceState so SPA route changes update the snapshot.
    const orig = { push: history.pushState, replace: history.replaceState };
    history.pushState = function (...args) {
      const r = orig.push.apply(this, args as Parameters<typeof history.pushState>);
      setTimeout(refresh, 0);
      return r;
    };
    history.replaceState = function (...args) {
      const r = orig.replace.apply(this, args as Parameters<typeof history.replaceState>);
      setTimeout(refresh, 0);
      return r;
    };

    return () => {
      window.removeEventListener("popstate", refresh);
      document.removeEventListener("selectionchange", onSelection);
      history.pushState = orig.push;
      history.replaceState = orig.replace;
    };
  }, []);

  return ctx;
}
