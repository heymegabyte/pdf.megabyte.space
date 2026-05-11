import { Hono } from "hono";
import { eq, and, desc, sql, like, or, isNull, count, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const publicFields = (
  p: typeof schema.projects.$inferSelect,
  author: { name: string | null; imageUrl: string | null } | null
) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  description: p.description,
  tags: p.tags ? p.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  pageSize: p.pageSize,
  viewCount: p.viewCount,
  editCount: p.editCount,
  thumbnailKey: p.thumbnailKey,
  updatedAt: p.updatedAt,
  createdAt: p.createdAt,
  author: author ? { name: author.name, imageUrl: author.imageUrl } : null,
});

const parseCursor = (raw: string | undefined): Date | null => {
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? new Date(ts) : null;
};

// GET /api/explore — paginated public feed. sort: recent|popular|trending
// Cursor pagination: ?cursor=<iso>&limit=24. Falls back to offset for popular+trending.
app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const limit = Math.min(Math.max(1, Number(c.req.query("limit") ?? "24")), 60);
  const offset = Math.max(0, Number(c.req.query("offset") ?? "0"));
  const cursor = parseCursor(c.req.query("cursor"));
  const tag = (c.req.query("tag") ?? "").trim().toLowerCase().slice(0, 40) || null;
  const sortParam = c.req.query("sort");
  const sort: "recent" | "popular" | "trending" =
    sortParam === "popular" ? "popular" : sortParam === "trending" ? "trending" : "recent";

  const halfLifeDays = Math.max(1, Number(c.env.TRENDING_HALFLIFE_DAYS ?? "7"));
  const candidatePool = Math.min(1000, Math.max(50, Number(c.env.TRENDING_CANDIDATE_POOL ?? "200")));

  const tagFilter = tag
    ? like(sql`lower(${schema.projects.tags})`, `%${tag}%`)
    : undefined;

  if (sort === "trending") {
    const now = Date.now();
    const rows = await db.query.projects.findMany({
      where: tagFilter
        ? and(eq(schema.projects.isPublic, true), tagFilter)
        : eq(schema.projects.isPublic, true),
      orderBy: [desc(schema.projects.updatedAt)],
      limit: candidatePool,
    });
    const scored = rows.map((p) => {
      const ageMs = now - new Date(p.updatedAt).getTime();
      const ageDays = Math.max(0, ageMs / 86_400_000);
      const decay = Math.exp(-ageDays / halfLifeDays);
      const score = (p.viewCount + p.editCount * 3) * decay;
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const page = scored.slice(offset, offset + limit).map((s) => s.p);

    const userIds = Array.from(new Set(page.map((r) => r.userId)));
    const users = userIds.length
      ? await db.query.users.findMany({
          where: (u, { inArray }) => inArray(u.id, userIds),
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    return c.json({
      projects: page.map((p) => publicFields(p, userMap.get(p.userId) ?? null)),
      nextOffset: scored.length > offset + limit ? offset + limit : null,
      nextCursor: null,
    });
  }

  if (sort === "popular") {
    const rows = await db.query.projects.findMany({
      where: tagFilter
        ? and(eq(schema.projects.isPublic, true), tagFilter)
        : eq(schema.projects.isPublic, true),
      orderBy: [desc(schema.projects.viewCount), desc(schema.projects.updatedAt)],
      limit,
      offset,
    });

    const userIds = Array.from(new Set(rows.map((r) => r.userId)));
    const users = userIds.length
      ? await db.query.users.findMany({
          where: (u, { inArray }) => inArray(u.id, userIds),
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return c.json({
      projects: rows.map((p) => publicFields(p, userMap.get(p.userId) ?? null)),
      nextOffset: rows.length === limit ? offset + limit : null,
      nextCursor: null,
    });
  }

  // recent — cursor-paginated by updatedAt (stable, indexable)
  const whereParts = [eq(schema.projects.isPublic, true)];
  if (cursor) whereParts.push(lt(schema.projects.updatedAt, cursor));
  if (tagFilter) whereParts.push(tagFilter);

  const rows = await db.query.projects.findMany({
    where: and(...whereParts),
    orderBy: [desc(schema.projects.updatedAt)],
    limit,
  });

  const userIds = Array.from(new Set(rows.map((r) => r.userId)));
  const users = userIds.length
    ? await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const last = rows[rows.length - 1];
  return c.json({
    projects: rows.map((p) => publicFields(p, userMap.get(p.userId) ?? null)),
    nextCursor: rows.length === limit && last ? new Date(last.updatedAt).toISOString() : null,
    nextOffset: null,
  });
});

// GET /api/explore/tags — tag cloud aggregation. Returns top 30 tags by count.
app.get("/tags", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select({ tags: schema.projects.tags })
    .from(schema.projects)
    .where(and(eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)))
    .limit(2000);
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.tags) continue;
    for (const raw of r.tags.split(",")) {
      const t = raw.trim().toLowerCase();
      if (!t || t.length > 40) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const tags = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([tag, count]) => ({ tag, count }));
  c.header("cache-control", "public, max-age=300");
  return c.json({ tags });
});

// GET /api/explore/search?q=...
app.get("/search", async (c) => {
  const db = getDb(c.env.DB);
  const q = (c.req.query("q") ?? "").trim().slice(0, 100);
  if (!q) return c.json({ projects: [] });
  const pattern = `%${q.toLowerCase()}%`;

  const rows = await db.query.projects.findMany({
    where: and(
      eq(schema.projects.isPublic, true),
      or(
        like(sql`lower(${schema.projects.title})`, pattern),
        like(sql`lower(${schema.projects.description})`, pattern),
        like(sql`lower(${schema.projects.tags})`, pattern)
      )
    ),
    orderBy: [desc(schema.projects.viewCount), desc(schema.projects.updatedAt)],
    limit: 40,
  });

  const userIds = Array.from(new Set(rows.map((r) => r.userId)));
  const users = userIds.length
    ? await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return c.json({
    projects: rows.map((p) => publicFields(p, userMap.get(p.userId) ?? null)),
    query: q,
  });
});

// GET /api/explore/:slug — fetch full public PDF by slug
app.get("/:slug", async (c) => {
  const db = getDb(c.env.DB);
  const slug = c.req.param("slug");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  c.executionCtx?.waitUntil(
    db
      .update(schema.projects)
      .set({ viewCount: sql`${schema.projects.viewCount} + 1` })
      .where(eq(schema.projects.id, project.id))
  );

  const author = await db.query.users.findFirst({
    where: eq(schema.users.id, project.userId),
  });

  return c.json({
    project: {
      ...publicFields(project, author ?? null),
      html: project.html,
      css: project.css,
      margin: project.margin,
    },
  });
});

// POST /api/explore/:slug/remix — duplicate a public PDF into the signed-in user's workspace
app.post("/:slug/remix", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const slug = c.req.param("slug");

  const source = await db.query.projects.findFirst({
    where: and(eq(schema.projects.slug, slug), eq(schema.projects.isPublic, true)),
  });
  if (!source) return c.json({ error: "Not found" }, 404);

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) return c.json({ error: "User not found" }, 404);
  const limit =
    user.plan === "pro"
      ? Number(c.env.PAID_PROJECT_LIMIT)
      : Number(c.env.FREE_PROJECT_LIMIT);
  const existing = await db
    .select({ n: count() })
    .from(schema.projects)
    .where(and(eq(schema.projects.userId, userId), isNull(schema.projects.deletedAt)));
  if ((existing[0]?.n ?? 0) >= limit) {
    return c.json({ error: "PROJECT_LIMIT_REACHED", limit, plan: user.plan }, 402);
  }

  const rateKey = `ratelimit:remix:${userId}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= 30) {
    return c.json({ error: "Slow down — too many remixes today.", code: "RATE_LIMIT" }, 429);
  }
  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 24 });

  const newId = nanoid(12);
  await db.insert(schema.projects).values({
    id: newId,
    userId,
    title: `Remix of ${source.title}`,
    html: source.html,
    css: source.css,
    pageSize: source.pageSize,
    margin: source.margin,
  });
  await db.insert(schema.snapshots).values({
    id: nanoid(12),
    projectId: newId,
    label: "Remixed",
    html: source.html,
    css: source.css,
    pageSize: source.pageSize,
    margin: source.margin,
  });

  c.executionCtx?.waitUntil(
    db
      .update(schema.projects)
      .set({ editCount: sql`${schema.projects.editCount} + 1` })
      .where(eq(schema.projects.id, source.id))
  );

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, newId) });
  return c.json({ project }, 201);
});

export default app;
