/**
 * CORS allow-list for the `/api/*` surface.
 *
 * Origins are matched exactly (no wildcards) and include credentials, so any
 * new browser entry-point (preview deploys, alt domains) must be added here
 * explicitly. `APP_URL` is sourced per-request from the env so production and
 * preview workers share this module without rebuilding.
 *
 * Returning `null` from the matcher (rather than echoing the unknown origin)
 * is what makes the browser drop the response — never relax this without
 * understanding why the same-origin guard exists.
 */
import type { Context } from "hono";
import type { Env } from "../types";

const STATIC_ALLOW = [
  "https://pdf.megabyte.space",
  "http://localhost:5173",
] as const;

/**
 * Resolves the CORS origin for one request. Returns the original origin when
 * allow-listed, `null` otherwise — Hono's `cors()` middleware reads `null` as
 * "block".
 */
export const corsOriginMatcher = (
  origin: string,
  c: Context<{ Bindings: Env }>
): string | null => {
  const appUrl = c.env?.APP_URL ?? "";
  const allowed: readonly string[] = appUrl ? [appUrl, ...STATIC_ALLOW] : STATIC_ALLOW;
  return allowed.includes(origin) ? origin : null;
};

export const CORS_ALLOW_HEADERS = ["Content-Type"] as const;
export const CORS_ALLOW_METHODS = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] as const;
