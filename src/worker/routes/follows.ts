import { Hono } from "hono";
import { eq, and, count, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import { sendEmail } from "../lib/emails";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use("*", requireAuth);

app.post("/:userId", async (c) => {
  const db = getDb(c.env.DB);
  const followerId = c.get("userId");
  const followingId = c.req.param("userId");
  if (followerId === followingId) return c.json({ error: "Cannot follow yourself" }, 400);
  const target = await db.query.users.findFirst({ where: eq(schema.users.id, followingId) });
  if (!target) return c.json({ error: "User not found" }, 404);

  try {
    await db.insert(schema.follows).values({
      id: `flw_${nanoid(10)}`,
      followerId,
      followingId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return c.json({ ok: true, alreadyFollowing: true });
    Sentry.captureException(err, { tags: { route: "follows", step: "insert" } });
    return c.json({ error: "Could not follow" }, 500);
  }

  const follower = await db.query.users.findFirst({ where: eq(schema.users.id, followerId) });
  if (!follower) return c.json({ ok: true });

  const recent = await db.query.projects.findMany({
    where: and(eq(schema.projects.userId, followerId), eq(schema.projects.isPublic, true)),
    orderBy: [desc(schema.projects.updatedAt)],
    limit: 3,
  });
  const followerStats = await db
    .select({ n: count() })
    .from(schema.follows)
    .where(eq(schema.follows.followingId, followerId));

  c.executionCtx.waitUntil(
    sendEmail(c.env, {
      userId: followingId,
      template: "new-follower",
      dedupKey: `follow:${followerId}:${followingId}`,
      data: {
        follower_name: follower.name ?? follower.email.split("@")[0],
        follower_avatar_url: follower.imageUrl ?? `${c.env.APP_URL}/og.jpg`,
        follower_bio: "",
        follower_profile_url: `${c.env.APP_URL}/u/${follower.id}`,
        follower_public_pdfs: recent.length,
        follower_total_views: 0,
        follower_followers: followerStats[0]?.n ?? 0,
        follow_back_url: `${c.env.APP_URL}/api/follows/${follower.id}`,
        recent_pdfs: recent.map((p) => ({
          url: `${c.env.APP_URL}/projects/${p.id}`,
          image: p.slug ? `${c.env.APP_URL}/s/og/${p.slug}.png` : `${c.env.APP_URL}/og.jpg`,
          title: p.title,
          views: 0,
          published_at_human: new Date(p.updatedAt).toLocaleDateString(),
        })),
      },
    }).catch((err) => {
      Sentry.captureException(err, { tags: { trigger: "new_follower" } });
    })
  );

  return c.json({ ok: true });
});

app.delete("/:userId", async (c) => {
  const db = getDb(c.env.DB);
  const followerId = c.get("userId");
  const followingId = c.req.param("userId");
  await db
    .delete(schema.follows)
    .where(and(eq(schema.follows.followerId, followerId), eq(schema.follows.followingId, followingId)));
  return c.json({ ok: true });
});

app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const rows = await db.query.follows.findMany({
    where: eq(schema.follows.followerId, userId),
    orderBy: [desc(schema.follows.createdAt)],
    limit: 200,
  });
  return c.json({ following: rows.map((r) => r.followingId) });
});

export default app;
