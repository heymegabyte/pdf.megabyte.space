import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/cloudflare";
import { SYSTEM_PROMPT } from "../lib/system-prompt";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const GUEST_DAILY_LIMIT = 10;
const GUEST_HISTORY_MAX = 12;

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(20000),
});

const chatBody = z.object({
  message: z.string().min(1).max(8000),
  html: z.string().max(60000).optional(),
  css: z.string().max(20000).optional(),
  pageSize: z.enum(["Letter", "A4", "Legal"]).optional(),
  margin: z.string().max(20).optional(),
  history: z.array(turnSchema).max(GUEST_HISTORY_MAX).optional(),
});

const MODEL_MAP = {
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-7",
} as const;

function extractBlocks(text: string) {
  const htmlMatch = text.match(/```html\s*\n([\s\S]*?)\n```/);
  const cssMatch = text.match(/```css\s*\n([\s\S]*?)\n```/);
  let reply = text
    .replace(/```html\s*\n[\s\S]*?\n```/g, "")
    .replace(/```css\s*\n[\s\S]*?\n```/g, "")
    .trim();
  if (!reply) reply = "Updated.";
  return { html: htmlMatch?.[1]?.trim(), css: cssMatch?.[1]?.trim(), reply };
}

function clientIp(c: { req: { header: (k: string) => string | undefined } }) {
  return (
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "anon"
  );
}

app.post("/chat", zValidator("json", chatBody), async (c) => {
  const ip = clientIp(c);
  const day = new Date().toISOString().slice(0, 10);
  const key = `guest:chat:${day}:${ip}`;
  const current = Number((await c.env.CACHE.get(key)) ?? "0");
  if (current >= GUEST_DAILY_LIMIT) {
    return c.json(
      {
        error: "Daily guest limit reached. Sign in for higher limits.",
        code: "GUEST_LIMIT",
        limit: GUEST_DAILY_LIMIT,
        used: current,
      },
      429,
      {
        "X-RateLimit-Limit": String(GUEST_DAILY_LIMIT),
        "X-RateLimit-Remaining": "0",
        "Retry-After": String(60 * 60 * (24 - new Date().getUTCHours())),
      }
    );
  }

  const {
    message,
    html = "",
    css = "",
    pageSize = "Letter",
    margin = "0.75in",
    history = [],
  } = c.req.valid("json");
  const model = "sonnet" as const;

  const docContext = `CURRENT DOCUMENT STATE
Page size: ${pageSize} | Print margins: ${margin} (applied by runtime @page rule — do NOT add @page or body padding)

\`\`\`html
${html || "<!-- empty -->"}
\`\`\`

\`\`\`css
${css || "/* empty — for standard documents add: .doc { padding: 0.75in; } on your top-level wrapper div */"}
\`\`\``;

  Sentry.addBreadcrumb({
    category: "ai",
    message: "guest.anthropic.messages.create",
    data: { model: MODEL_MAP[model], ip: ip.slice(0, 12) + "…", historyTurns: history.length },
    level: "info",
  });
  const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [{ type: "text", text: docContext, cache_control: { type: "ephemeral" } }],
    },
    {
      role: "assistant",
      content: "Got it — I have the current document. What would you like to change?",
    },
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: message },
  ];

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: MODEL_MAP[model],
      max_tokens: 8000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages,
    }, { timeout: 55000 });
  } catch (err) {
    Sentry.captureException(err);
    const isOverload = err instanceof Anthropic.APIError && (err.status === 529 || err.status === 503);
    return c.json(
      { error: isOverload ? "AI is overloaded — try again in a moment." : "AI unavailable. Please try again." },
      isOverload ? 503 : 502
    );
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const { html: nextHtml, css: nextCss, reply } = extractBlocks(text);

  await c.env.CACHE.put(key, String(current + 1), { expirationTtl: 60 * 60 * 26 });

  const remaining = Math.max(0, GUEST_DAILY_LIMIT - (current + 1));
  return c.json(
    {
      reply,
      rawText: text,
      html: nextHtml,
      css: nextCss,
      usage: response.usage,
      model: MODEL_MAP[model],
      quota: { limit: GUEST_DAILY_LIMIT, used: current + 1 },
    },
    200,
    {
      "X-RateLimit-Limit": String(GUEST_DAILY_LIMIT),
      "X-RateLimit-Remaining": String(remaining),
    }
  );
});

app.get("/quota", async (c) => {
  const ip = clientIp(c);
  const day = new Date().toISOString().slice(0, 10);
  const key = `guest:chat:${day}:${ip}`;
  const used = Number((await c.env.CACHE.get(key)) ?? "0");
  return c.json({ limit: GUEST_DAILY_LIMIT, used, remaining: Math.max(0, GUEST_DAILY_LIMIT - used) });
});

export default app;
