import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc, isNull, count, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import { STARTER_HTML, STARTER_CSS } from "../lib/templates";
import { generateAiTitle } from "../lib/ai-title";
import { generateAiMeta } from "../lib/ai-meta";
import { generateAiPrettier } from "../lib/ai-prettier";
import { generateAiBlock, ALLOWED_BLOCK_KINDS, type BlockKind } from "../lib/ai-block";
import { sendEmail } from "../lib/emails";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use("*", requireAuth);

const FREE_EDITS_PER_PDF = 10;

const updateBody = z.object({
  title: z.string().min(1).max(80).optional(),
  html: z.string().max(500_000).optional(),
  css: z.string().max(200_000).optional(),
  pageSize: z.enum(["Letter", "A4", "Legal"]).optional(),
  margin: z.string().regex(/^[\d.]+(in|mm|cm|pt)$/).optional(),
  description: z.string().max(280).optional(),
  tags: z.string().max(200).optional(),
});

const publishBody = z.object({
  isPublic: z.boolean(),
  description: z.string().max(280).optional(),
  tags: z.string().max(200).optional(),
});

const projectFields = (p: typeof schema.projects.$inferSelect) => ({
  id: p.id,
  title: p.title,
  pageSize: p.pageSize,
  margin: p.margin,
  slug: p.slug,
  isPublic: p.isPublic,
  viewCount: p.viewCount,
  editCount: p.editCount,
  aiTitleGenerated: p.aiTitleGenerated,
  description: p.description,
  tags: p.tags,
  thumbnailKey: p.thumbnailKey,
  updatedAt: p.updatedAt,
  createdAt: p.createdAt,
});

app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const rows = await db.query.projects.findMany({
    where: and(eq(schema.projects.userId, userId), isNull(schema.projects.deletedAt)),
    orderBy: [desc(schema.projects.updatedAt)],
    limit: 100,
  });
  const ids = rows.map((p) => p.id);
  const turnCounts = ids.length
    ? await db
        .select({ projectId: schema.turns.projectId, n: count() })
        .from(schema.turns)
        .where(inArray(schema.turns.projectId, ids))
        .groupBy(schema.turns.projectId)
    : [];
  const turnMap = new Map(turnCounts.map((t) => [t.projectId, t.n]));
  return c.json({
    projects: rows.map((p) => ({
      ...projectFields(p),
      turns: turnMap.get(p.id) ?? 0,
    })),
  });
});

app.post("/", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
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
    if (user.plan !== "pro") {
      // Dedup at the limit threshold (one nudge per user, not per click).
      c.executionCtx.waitUntil(
        sendEmail(c.env, {
          userId,
          template: "free-limit",
          dedupKey: `free-limit:${userId}`,
          data: {
            current_pdfs: existing[0]?.n ?? limit,
            free_limit: limit,
            paid_limit: c.env.PAID_PROJECT_LIMIT,
            upgrade_url: `${c.env.APP_URL}/account/billing`,
            pricing_url: `${c.env.APP_URL}/pricing`,
          },
        }).catch(() => {})
      );
    }
    return c.json(
      { error: "PROJECT_LIMIT_REACHED", limit, plan: user.plan },
      402
    );
  }
  const id = nanoid(12);
  await db.insert(schema.projects).values({
    id,
    userId,
    title: "Untitled PDF",
    html: STARTER_HTML,
    css: STARTER_CSS,
    pageSize: "Letter",
    margin: "0.75in",
    lastPromptAt: new Date(),
  });
  await db.insert(schema.snapshots).values({
    id: nanoid(12),
    projectId: id,
    label: "Initial",
    html: STARTER_HTML,
    css: STARTER_CSS,
    pageSize: "Letter",
    margin: "0.75in",
  });
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
  return c.json({ project }, 201);
});

app.get("/:id", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, c.req.param("id")), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const turns = await db.query.turns.findMany({
    where: eq(schema.turns.projectId, project.id),
    orderBy: [schema.turns.createdAt],
    limit: 200,
  });
  const snapshots = await db.query.snapshots.findMany({
    where: eq(schema.snapshots.projectId, project.id),
    orderBy: [desc(schema.snapshots.createdAt)],
    limit: 50,
  });
  const shares = await db.query.shareLinks.findMany({
    where: eq(schema.shareLinks.projectId, project.id),
  });
  return c.json({
    project,
    turns: turns.map((t) => ({
      id: t.id,
      role: t.role,
      content: t.content,
      model: t.model,
      createdAt: t.createdAt,
      snapshotId: t.snapshotId,
    })),
    snapshots: snapshots.map((s) => ({
      id: s.id,
      label: s.label,
      pageSize: s.pageSize,
      margin: s.margin,
      createdAt: s.createdAt,
    })),
    shares,
    limits: { freeEditsPerPdf: FREE_EDITS_PER_PDF },
  });
});

app.patch("/:id", zValidator("json", updateBody), async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const patch = c.req.valid("json");
  if (Object.keys(patch).length === 0) {
    return c.json({ project });
  }

  const touchesContent = patch.html !== undefined || patch.css !== undefined;
  if (touchesContent) {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (user?.plan !== "pro" && project.editCount >= FREE_EDITS_PER_PDF) {
      return c.json(
        {
          error: `You've used all ${FREE_EDITS_PER_PDF} free edits on this PDF. Upgrade for unlimited edits.`,
          code: "EDIT_LIMIT_REACHED",
          editCount: project.editCount,
          limit: FREE_EDITS_PER_PDF,
        },
        402
      );
    }
  }

  await db
    .update(schema.projects)
    .set({
      ...patch,
      ...(touchesContent ? { editCount: project.editCount + 1 } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, id));
  const updated = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
  return c.json({ project: updated });
});

app.delete("/:id", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  await db
    .update(schema.projects)
    .set({ deletedAt: new Date() })
    .where(eq(schema.projects.id, id));
  return c.json({ ok: true });
});

app.post("/:id/duplicate", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
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
  const source = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, c.req.param("id")), eq(schema.projects.userId, userId)),
  });
  if (!source) return c.json({ error: "Not found" }, 404);
  const newId = nanoid(12);
  await db.insert(schema.projects).values({
    id: newId,
    userId,
    title: `Copy of ${source.title}`,
    html: source.html,
    css: source.css,
    pageSize: source.pageSize,
    margin: source.margin,
  });
  await db.insert(schema.snapshots).values({
    id: nanoid(12),
    projectId: newId,
    label: "Duplicated",
    html: source.html,
    css: source.css,
    pageSize: source.pageSize,
    margin: source.margin,
  });
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, newId) });
  return c.json({ project }, 201);
});

app.post("/:id/snapshots/:snapshotId/restore", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const snapId = c.req.param("snapshotId");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const snap = await db.query.snapshots.findFirst({
    where: and(eq(schema.snapshots.id, snapId), eq(schema.snapshots.projectId, id)),
  });
  if (!snap) return c.json({ error: "Snapshot not found" }, 404);
  await db.batch([
    db.insert(schema.snapshots).values({
      id: nanoid(12),
      projectId: id,
      label: "Before restore",
      html: project.html,
      css: project.css,
      pageSize: project.pageSize,
      margin: project.margin,
    }),
    db.update(schema.projects)
      .set({
        html: snap.html,
        css: snap.css,
        pageSize: snap.pageSize,
        margin: snap.margin,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id)),
  ]);
  return c.json({ ok: true });
});

// AI auto-title — uses the entire conversation + current HTML to generate a clean,
// human-readable title. Throttled to once per minute per user.
app.post("/:id/ai-title", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const rateKey = `ratelimit:aititle:${userId}`;
  const recent = await c.env.CACHE.get(rateKey);
  if (recent) return c.json({ error: "Slow down — try again in a moment.", code: "RATE_LIMIT" }, 429);

  const turns = await db.query.turns.findMany({
    where: eq(schema.turns.projectId, id),
    orderBy: [schema.turns.createdAt],
    limit: 8,
  });
  const transcript = turns
    .filter((t) => t.role === "user")
    .map((t) => t.content)
    .join("\n");

  let title: string;
  try {
    title = await generateAiTitle(c.env, {
      html: project.html.slice(0, 4000),
      transcript: transcript.slice(0, 2000),
      currentTitle: project.title,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "ai-title" } });
    return c.json({ error: "AI title unavailable" }, 502);
  }

  await c.env.CACHE.put(rateKey, "1", { expirationTtl: 60 });
  await db
    .update(schema.projects)
    .set({ title, aiTitleGenerated: true, updatedAt: new Date() })
    .where(eq(schema.projects.id, id));
  return c.json({ title });
});

// AI auto-description + tags for the Explore card. Throttled 1/min per user.
app.post("/:id/ai-meta", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const rateKey = `ratelimit:aimeta:${userId}`;
  const recent = await c.env.CACHE.get(rateKey);
  if (recent) return c.json({ error: "Slow down — try again in a moment.", code: "RATE_LIMIT" }, 429);

  const turns = await db.query.turns.findMany({
    where: eq(schema.turns.projectId, id),
    orderBy: [schema.turns.createdAt],
    limit: 8,
  });
  const transcript = turns
    .filter((t) => t.role === "user")
    .map((t) => t.content)
    .join("\n");

  let meta: { description: string; tags: string[] };
  try {
    meta = await generateAiMeta(c.env, {
      html: project.html.slice(0, 4000),
      transcript: transcript.slice(0, 2000),
      title: project.title,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "ai-meta" } });
    return c.json({ error: "AI meta unavailable" }, 502);
  }

  if (!meta.description) return c.json({ error: "AI meta unavailable" }, 502);

  await c.env.CACHE.put(rateKey, "1", { expirationTtl: 60 });
  await db
    .update(schema.projects)
    .set({
      description: meta.description,
      tags: meta.tags.join(","),
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, id));
  return c.json({ description: meta.description, tags: meta.tags });
});

// "Make this prettier" — AI rewrites HTML+CSS for better typography/spacing/hierarchy.
// Counts as one edit. Rate-limited 1/min per user.
app.post("/:id/prettier", async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (user?.plan !== "pro" && project.editCount >= FREE_EDITS_PER_PDF) {
    return c.json(
      {
        error: `You've used all ${FREE_EDITS_PER_PDF} free edits on this PDF. Upgrade for unlimited edits.`,
        code: "EDIT_LIMIT_REACHED",
        editCount: project.editCount,
        limit: FREE_EDITS_PER_PDF,
      },
      402
    );
  }

  const rateKey = `ratelimit:prettier:${userId}`;
  const recent = await c.env.CACHE.get(rateKey);
  if (recent) return c.json({ error: "Slow down — try again in a moment.", code: "RATE_LIMIT" }, 429);

  let result: { html: string; css: string } | null;
  try {
    result = await generateAiPrettier(c.env, {
      html: project.html,
      css: project.css,
      title: project.title,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "ai-prettier" } });
    return c.json({ error: "AI prettier unavailable" }, 502);
  }
  if (!result) return c.json({ error: "AI prettier unavailable" }, 502);

  await c.env.CACHE.put(rateKey, "1", { expirationTtl: 60 });

  await db.batch([
    db.insert(schema.snapshots).values({
      id: nanoid(12),
      projectId: id,
      label: "Before prettier",
      html: project.html,
      css: project.css,
      pageSize: project.pageSize,
      margin: project.margin,
    }),
    db.update(schema.projects)
      .set({
        html: result.html,
        css: result.css,
        editCount: project.editCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id)),
  ]);

  const updated = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
  return c.json({ project: updated });
});

// Block library — insert AI-generated <section> for cover/toc/signature/references/cta/etc.
// Returns the rendered HTML so the client can splice client-side, or appended via ?mode=append.
const insertBody = z.object({
  kind: z.enum(ALLOWED_BLOCK_KINDS as [BlockKind, ...BlockKind[]]),
  context: z.string().max(500).optional(),
  mode: z.enum(["preview", "append", "prepend"]).default("preview"),
});

app.post("/:id/insert", zValidator("json", insertBody), async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const rateKey = `ratelimit:insert:${userId}`;
  const recent = await c.env.CACHE.get(rateKey);
  if (recent) return c.json({ error: "Slow down — try again in a moment.", code: "RATE_LIMIT" }, 429);

  const { kind, context, mode } = c.req.valid("json");

  let block: string | null;
  try {
    block = await generateAiBlock(c.env, {
      kind,
      title: project.title,
      currentHtml: project.html,
      context,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "ai-insert", kind } });
    return c.json({ error: "AI insert unavailable" }, 502);
  }
  if (!block) return c.json({ error: "AI insert unavailable" }, 502);

  await c.env.CACHE.put(rateKey, "1", { expirationTtl: 30 });

  if (mode === "preview") {
    return c.json({ block });
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (user?.plan !== "pro" && project.editCount >= FREE_EDITS_PER_PDF) {
    return c.json(
      {
        error: `You've used all ${FREE_EDITS_PER_PDF} free edits on this PDF. Upgrade for unlimited edits.`,
        code: "EDIT_LIMIT_REACHED",
        editCount: project.editCount,
        limit: FREE_EDITS_PER_PDF,
      },
      402
    );
  }

  const nextHtml =
    mode === "append" ? `${project.html.trimEnd()}\n${block}` : `${block}\n${project.html.trimStart()}`;

  await db.batch([
    db.insert(schema.snapshots).values({
      id: nanoid(12),
      projectId: id,
      label: `Before insert: ${kind}`,
      html: project.html,
      css: project.css,
      pageSize: project.pageSize,
      margin: project.margin,
    }),
    db.update(schema.projects)
      .set({
        html: nextHtml,
        editCount: project.editCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id)),
  ]);

  const updated = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
  return c.json({ project: updated, block });
});

// Toggle public visibility for the community Explore feed.
app.post("/:id/publish", zValidator("json", publishBody), async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const id = c.req.param("id");
  const project = await db.query.projects.findFirst({
    where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const { isPublic, description, tags } = c.req.valid("json");
  const slug = project.slug ?? nanoid(8);
  await db
    .update(schema.projects)
    .set({
      isPublic,
      slug,
      ...(description !== undefined ? { description } : {}),
      ...(tags !== undefined ? { tags } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, id));
  const updated = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
  return c.json({ project: updated });
});

export default app;
