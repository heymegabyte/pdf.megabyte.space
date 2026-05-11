import { createMiddleware } from "hono/factory";
import { findUserBySession, parseCookies, SESSION_COOKIE } from "../lib/auth";
import type { Env, Variables } from "../types";

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const cookies = parseCookies(c.req.header("Cookie"));
    const cookie = cookies[SESSION_COOKIE];
    if (!cookie) return c.json({ error: "Unauthorized" }, 401);

    const result = await findUserBySession(c.env, cookie);
    if (!result) return c.json({ error: "Unauthorized" }, 401);

    c.set("userId", result.user.id);
    c.set("userEmail", result.user.email);
    await next();
  }
);

// Hydrates userId/userEmail when a valid session exists, but never rejects.
// Use for endpoints where anonymous responses are valid (e.g. /api/me probe).
export const optionalAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const cookies = parseCookies(c.req.header("Cookie"));
    const cookie = cookies[SESSION_COOKIE];
    if (cookie) {
      const result = await findUserBySession(c.env, cookie);
      if (result) {
        c.set("userId", result.user.id);
        c.set("userEmail", result.user.email);
      }
    }
    await next();
  }
);
