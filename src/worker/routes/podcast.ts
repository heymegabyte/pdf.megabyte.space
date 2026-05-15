import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as Sentry from "@sentry/cloudflare";
import { listmonkUpsertSubscriber, listmonkConfigured } from "../lib/listmonk";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Public-facing podcast routes mounted at `/podcast/*` (the clean URL
 * pasted into Apple/Spotify/Overcast — `/api/podcast/*` would be ugly
 * and confuse podcast directories).
 */
export const podcastPublic = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Minimal podcast RSS 2.0 feed with iTunes namespace. Ships empty (0
 * <item> entries) so Apple/Spotify/Overcast can already validate +
 * accept the feed pre-launch. When Episode 1 lands in R2 we slot it in
 * here and every subscriber gets it without re-onboarding.
 */
podcastPublic.get("/feed.xml", (c) => {
  const appUrl = c.env.APP_URL || "https://pdf.megabyte.space";
  const now = new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>The Megabyte PDF Podcast</title>
    <link>${appUrl}/#podcast</link>
    <atom:link href="${appUrl}/podcast/feed.xml" rel="self" type="application/rss+xml" />
    <description>Short conversations on prompt craft, document design, and the people shipping real PDFs from chat. Premiere May 2026.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <copyright>© Megabyte Labs</copyright>
    <itunes:author>Megabyte Labs</itunes:author>
    <itunes:owner>
      <itunes:name>Brian Zalewski</itunes:name>
      <itunes:email>hey@megabyte.space</itunes:email>
    </itunes:owner>
    <itunes:summary>How to write a prompt that prints.</itunes:summary>
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Technology" />
    <itunes:category text="Business"><itunes:category text="Entrepreneurship" /></itunes:category>
    <itunes:image href="${appUrl}/podcast/cover.png" />
    <itunes:type>episodic</itunes:type>
    <image>
      <url>${appUrl}/podcast/cover.png</url>
      <title>The Megabyte PDF Podcast</title>
      <link>${appUrl}/#podcast</link>
    </image>
  </channel>
</rss>`;
  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600",
    },
  });
});

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
