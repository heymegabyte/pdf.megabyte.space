import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as Sentry from "@sentry/cloudflare";
import { listmonkUpsertSubscriber, listmonkConfigured } from "../lib/listmonk";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const bodySchema = z.object({
  email: z.string().email().max(254),
});

/**
 * Public podcast waitlist subscribe. Anonymous, rate-limited per-IP (10/day) to
 * keep cost-of-abuse low without forcing Turnstile on a hero CTA. Pushes the
 * subscriber into Listmonk with attribs.podcast_waitlist=true so a future
 * "Episode 1 is live" campaign can target this exact cohort.
 */
app.post("/subscribe", zValidator("json", bodySchema), async (c) => {
  const { email } = c.req.valid("json");
  const ip = c.req.header("CF-Connecting-IP") || "anon";
  const day = new Date().toISOString().slice(0, 10);
  const rateKey = `ratelimit:podcast:${ip}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= 10) return c.json({ error: "Too many signups today." }, 429);
  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  if (!listmonkConfigured(c.env)) {
    // Still accept the signup — log to Sentry for manual export later so we
    // never lose an interested subscriber due to a misconfigured backend.
    Sentry.captureMessage("podcast.subscribe.no_listmonk", {
      level: "warning",
      extra: { email, ip },
    });
    return c.json({ ok: true, queued: true });
  }

  const podcastListIdRaw = c.env.LISTMONK_PODCAST_LIST_ID;
  const listIds = podcastListIdRaw
    ? [Number(podcastListIdRaw)]
    : c.env.LISTMONK_LIST_ID
    ? [Number(c.env.LISTMONK_LIST_ID)]
    : [];

  const res = await listmonkUpsertSubscriber(c.env, {
    email,
    listIds,
    attribs: { podcast_waitlist: true, source: "landing_podcast_teaser", joined: day },
  });
  if (!res.ok) {
    Sentry.captureMessage("podcast.subscribe.listmonk_fail", {
      level: "error",
      extra: { email, status: res.status, error: res.error },
    });
    return c.json({ error: "Couldn't save your spot. Try again in a minute." }, 502);
  }
  Sentry.addBreadcrumb({
    category: "podcast",
    message: "subscribe",
    data: { ip, listIds },
    level: "info",
  });
  return c.json({ ok: true });
});

export default app;
