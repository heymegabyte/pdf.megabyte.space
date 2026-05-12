import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import { SYSTEM_PROMPT } from "../lib/system-prompt";
import type { Env, Variables } from "../types";
import { CHAT_RATE_LIMITS, isPaid } from "../../shared/plans";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const chatBody = z.object({
  message: z.string().min(1).max(8000),
  model: z.enum(["sonnet", "opus"]).optional(),
});

const MODEL_MAP = {
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-7",
} as const;

const extractBlocks = (text: string): { html?: string; css?: string; reply: string } => {
  const htmlMatch = text.match(/```html\s*\n([\s\S]*?)\n```/);
  const cssMatch = text.match(/```css\s*\n([\s\S]*?)\n```/);
  let reply = text
    .replace(/```html\s*\n[\s\S]*?\n```/g, "")
    .replace(/```css\s*\n[\s\S]*?\n```/g, "")
    .trim();
  if (!reply) reply = "Updated.";
  return {
    html: htmlMatch?.[1]?.trim(),
    css: cssMatch?.[1]?.trim(),
    reply,
  };
};

const CHAT_LIMITS = CHAT_RATE_LIMITS;

app.post("/projects/:id/chat", requireAuth, zValidator("json", chatBody), async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const projectId = c.req.param("id");

  const [project, user] = await Promise.all([
    db.query.projects.findFirst({
      where: and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)),
    }),
    db.query.users.findFirst({ where: eq(schema.users.id, userId) }),
  ]);
  if (!project) return c.json({ error: "Not found" }, 404);
  if (!user) return c.json({ error: "User not found" }, 404);

  const dailyLimit =
    user.plan === "unlimited" ? CHAT_LIMITS.unlimited : user.plan === "pro" ? CHAT_LIMITS.pro : CHAT_LIMITS.free;
  const day = new Date().toISOString().slice(0, 10);
  const rateKey = `ratelimit:chat:${userId}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  const remaining = Math.max(0, dailyLimit - used);
  if (used >= dailyLimit) {
    return c.json(
      { error: "Daily chat limit reached. Try again tomorrow.", code: "RATE_LIMIT", limit: dailyLimit, used },
      429,
      {
        "X-RateLimit-Limit": String(dailyLimit),
        "X-RateLimit-Remaining": "0",
        "Retry-After": String(60 * 60 * (24 - new Date().getUTCHours())),
      }
    );
  }
  const { message, model = "sonnet" } = c.req.valid("json");
  if (model === "opus" && !isPaid(user.plan)) {
    return c.json({ error: "Opus model requires a Pro or Unlimited subscription.", code: "PLAN_REQUIRED" }, 402);
  }
  const modelId = MODEL_MAP[model];

  const history = await db.query.turns.findMany({
    where: eq(schema.turns.projectId, projectId),
    orderBy: [schema.turns.createdAt],
    limit: 40,
  });

  const userTurnId = nanoid(12);
  await db.insert(schema.turns).values({
    id: userTurnId,
    projectId,
    role: "user",
    content: message,
  });
  // Track last-prompt-at so the abandoned-prompt cron can find drafts.
  await db
    .update(schema.projects)
    .set({ lastPromptAt: new Date() })
    .where(eq(schema.projects.id, projectId));

  const docContext = `CURRENT DOCUMENT STATE
Page size: ${project.pageSize} | Print margins: ${project.margin} (applied by runtime @page rule — do NOT add @page or body padding)

\`\`\`html
${project.html || "<!-- empty -->"}
\`\`\`

\`\`\`css
${project.css || "/* empty — for standard documents add: .doc { padding: 0.75in; } on your top-level wrapper div */"}
\`\`\``;

  Sentry.addBreadcrumb({
    category: "ai",
    message: "anthropic.messages.create",
    data: { model: modelId, projectId, userId, turns: history.length, plan: user.plan },
    level: "info",
  });
  const startedAt = Date.now();
  const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        { type: "text", text: docContext, cache_control: { type: "ephemeral" } },
      ],
    },
    {
      role: "assistant",
      content: "Got it — I have the current document. What would you like to change?",
    },
    ...history.map((t) => ({
      role: t.role as "user" | "assistant",
      content: t.content,
    })),
    { role: "user", content: message },
  ];

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 8000,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages,
    }, { timeout: 55000 });
  } catch (err) {
    Sentry.captureException(err);
    // Roll back the user turn so the conversation isn't orphaned
    await db.delete(schema.turns).where(eq(schema.turns.id, userTurnId));
    const isOverload = err instanceof Anthropic.APIError && (err.status === 529 || err.status === 503);
    return c.json(
      { error: isOverload ? "AI is overloaded — try again in a moment." : "AI unavailable. Please try again." },
      isOverload ? 503 : 502,
      {
        "X-RateLimit-Limit": String(dailyLimit),
        "X-RateLimit-Remaining": String(remaining),
      }
    );
  }

  const durationMs = Date.now() - startedAt;
  Sentry.addBreadcrumb({
    category: "ai",
    message: "anthropic.messages.create.success",
    data: {
      model: modelId,
      duration_ms: durationMs,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_read_tokens: response.usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: response.usage.cache_creation_input_tokens ?? 0,
      stop_reason: response.stop_reason,
    },
    level: "info",
  });

  // Only increment rate counter on successful AI response
  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const { html, css, reply } = extractBlocks(text);

  let snapshotId: string | undefined;
  if (html !== undefined || css !== undefined) {
    const newHtml = html ?? project.html;
    const newCss = css ?? project.css;
    snapshotId = nanoid(12);
    await db.insert(schema.snapshots).values({
      id: snapshotId,
      projectId,
      label: message.slice(0, 80),
      html: newHtml,
      css: newCss,
      pageSize: project.pageSize,
      margin: project.margin,
    });

    // Auto-title: extract <h1> or <title> from HTML when project is still untitled
    const autoTitle =
      project.title === "Untitled PDF" && newHtml
        ? (() => {
            const h1 = newHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
              ?.replace(/<[^>]+>/g, "").trim().slice(0, 80);
            const title = newHtml.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim().slice(0, 80);
            const candidate = h1 || title || null;
            return candidate && candidate.length >= 3 ? candidate : null;
          })()
        : null;

    await db
      .update(schema.projects)
      .set({
        html: newHtml,
        css: newCss,
        updatedAt: new Date(),
        ...(autoTitle ? { title: autoTitle } : {}),
      })
      .where(eq(schema.projects.id, projectId));
  }

  await db.insert(schema.turns).values({
    id: nanoid(12),
    projectId,
    role: "assistant",
    content: text,
    model: modelId,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    snapshotId: snapshotId ?? null,
  });

  const updated = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
  });

  return c.json(
    {
      reply,
      rawText: text,
      project: updated,
      snapshotId,
      usage: response.usage,
      model: modelId,
    },
    200,
    {
      "X-RateLimit-Limit": String(dailyLimit),
      "X-RateLimit-Remaining": String(remaining - 1),
    }
  );
});

export default app;
