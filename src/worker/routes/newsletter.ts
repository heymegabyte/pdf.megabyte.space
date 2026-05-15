import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as Sentry from "@sentry/cloudflare";
import {
  listmonkUpsertSubscriber,
  listmonkConfigured,
  listmonkSendTx,
} from "../lib/listmonk";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const bodySchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(64).optional(),
});

/**
 * Public newsletter subscribe. Distinct cohort from podcast waitlist —
 * product updates, new templates, prompt-craft tips. Same per-IP cap
 * (10/day) keeps cost-of-abuse low without forcing a visible Turnstile
 * widget on the inline footer signup.
 */
app.post("/subscribe", zValidator("json", bodySchema), async (c) => {
  const { email, source } = c.req.valid("json");
  const ip = c.req.header("CF-Connecting-IP") || "anon";
  const day = new Date().toISOString().slice(0, 10);
  const rateKey = `ratelimit:newsletter:${ip}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= 10) return c.json({ error: "Too many signups today." }, 429);
  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  if (!listmonkConfigured(c.env)) {
    Sentry.captureMessage("newsletter.subscribe.no_listmonk", {
      level: "warning",
      extra: { email, ip, source },
    });
    return c.json({ ok: true, queued: true });
  }

  const newsletterListRaw = c.env.LISTMONK_NEWSLETTER_LIST_ID;
  const listIds = newsletterListRaw
    ? [Number(newsletterListRaw)]
    : c.env.LISTMONK_LIST_ID
    ? [Number(c.env.LISTMONK_LIST_ID)]
    : [];

  const res = await listmonkUpsertSubscriber(c.env, {
    email,
    listIds,
    attribs: {
      newsletter: true,
      source: source ?? "landing_newsletter",
      joined: day,
    },
  });
  if (!res.ok) {
    Sentry.captureMessage("newsletter.subscribe.listmonk_fail", {
      level: "error",
      extra: { email, status: res.status, error: res.error },
    });
    return c.json({ error: "Couldn't save your spot. Try again in a minute." }, 502);
  }

  // Fire-and-forget welcome email — never block the response on a failed send.
  // The `newsletter_welcome` template falls back gracefully if unregistered.
  c.executionCtx.waitUntil(
    (async () => {
      const tx = await listmonkSendTx(c.env, {
        subscriberEmail: email,
        templateAlias: "newsletter_welcome",
        data: {
          email,
          app_name: c.env.APP_NAME ?? "Megabyte PDF",
          app_url: c.env.APP_URL ?? "https://pdf.megabyte.space",
          source: source ?? "landing_newsletter",
        },
      });
      if (!tx.ok) {
        Sentry.addBreadcrumb({
          category: "newsletter",
          message: "welcome_skipped",
          data: { email, error: tx.error },
          level: "info",
        });
      }
    })()
  );

  Sentry.addBreadcrumb({
    category: "newsletter",
    message: "subscribe",
    data: { ip, listIds, source },
    level: "info",
  });
  return c.json({ ok: true });
});

export default app;
