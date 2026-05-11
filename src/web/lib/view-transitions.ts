// View Transitions integration for SPA navigation.
//
// Captures internal anchor clicks BEFORE react-router's own handler fires,
// then wraps the navigation in document.startViewTransition() so the
// browser can cross-fade between page snapshots. Header and footer carry
// matching `view-transition-name` values (set via data-vt attributes) so
// they snapshot as their own region and visually stay still while only
// the main content fades out and back in.
//
// Graceful degradation: if View Transitions API is absent (Firefox <125,
// Safari <18) or prefers-reduced-motion is set, we fall back to a direct
// navigation — no animation, no behavior change.

import type { NavigateFunction } from "react-router-dom";

function shouldIntercept(e: MouseEvent): HTMLAnchorElement | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
  if (!a) return null;
  if (a.target && a.target !== "" && a.target !== "_self") return null;
  if (a.hasAttribute("download")) return null;
  const href = a.getAttribute("href") ?? "";
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return a;
}

export function attachViewTransitions(navigate: NavigateFunction): () => void {
  if (typeof document.startViewTransition !== "function") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const onClick = (e: MouseEvent) => {
    const a = shouldIntercept(e);
    if (!a) return;
    const url = new URL(a.href, location.href);
    e.preventDefault();
    e.stopPropagation();
    document.startViewTransition(() => {
      navigate(url.pathname + url.search + url.hash);
    });
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
