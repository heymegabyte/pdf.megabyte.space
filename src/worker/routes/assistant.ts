import { Hono } from "hono";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/cloudflare";
import { optionalAuth } from "../middleware/auth";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  thread: z.string().min(1).max(64).optional(),
  documentContext: z
    .object({ title: z.string().max(200).optional(), html: z.string().max(20000).optional() })
    .optional(),
});

const SYSTEM = `You are Megabyte Assist, the in-product AI concierge for Megabyte PDF (https://pdf.megabyte.space) — a chat-to-PDF SaaS built on Cloudflare Workers.

Your job:
- Answer questions about Megabyte PDF features, plans (Guest, Free, Pro), and pricing ($9/mo Pro).
- Help users craft better prompts for the document editor (invoices, resumes, reports, contracts, proposals, cover letters, technical specs).
- Suggest improvements to a document the user is currently editing, if they share its HTML.
- Explain how PDFs render (8.5×11 page, @page rules, page-break-before:always, embedded fonts).
- Recommend community templates from the Templates page and PDFs from /explore.
- Surface adjacent tools from the Megabyte ecosystem when relevant: megabyte.space (home), music.megabyte.space, ghost.megabyte.space, hello.megabyte.space.

Voice: Sharp. Punchy. Concise. Plain English. Action verbs. Never marketing fluff. Never "leverage", "robust", "seamless", "world-class". Cite specific numbers and features.

Format: Markdown. Code blocks for HTML/CSS examples. Bullets for lists ≥3 items. Bold for action items. Keep responses under 200 words unless the user asks for depth.

Constraints:
- Never invent product features. If unsure, say "I don't think Megabyte PDF does that yet — feature request: hey@megabyte.space".
- Never reveal API keys, secrets, or internal architecture in detail beyond Cloudflare Workers + Hono + Anthropic.
- If asked about competitors (PandaDoc, DocuSign, Adobe Acrobat), be honest about strengths and trade-offs.
- Never claim "studies show" without a specific source.

When the user is on a specific page or editing a document, the client may include documentContext. Use it to give targeted advice.`;

const FREE_LIMIT = 30;
const PRO_LIMIT = 300;
const ANON_LIMIT = 5;

const sse = (event: string, data: unknown): string =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

app.post("/chat", optionalAuth, async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);
  const { messages, documentContext } = parsed.data;

  const userId = c.get("userId");
  let plan: "free" | "pro" = "free";
  if (userId) {
    const db = getDb(c.env.DB);
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (user) plan = user.plan;
  }

  const day = new Date().toISOString().slice(0, 10);
  const limit = userId ? (plan === "pro" ? PRO_LIMIT : FREE_LIMIT) : ANON_LIMIT;
  const rateId = userId || `ip:${c.req.header("CF-Connecting-IP") || "anon"}`;
  const rateKey = `ratelimit:assistant:${rateId}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  if (used >= limit) {
    return c.json({ error: "Daily assistant limit reached. Try again tomorrow.", code: "RATE_LIMIT", limit, used }, 429);
  }

  if (!c.env.ANTHROPIC_API_KEY) {
    return c.json({ error: "Assistant temporarily unavailable." }, 503);
  }

  const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

  // Prepend optional document context as a user-role "system context" message.
  const contextNote = documentContext?.html
    ? [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `CURRENT DOCUMENT CONTEXT
Title: ${documentContext.title || "Untitled"}

\`\`\`html
${documentContext.html.slice(0, 12000)}
\`\`\``,
              cache_control: { type: "ephemeral" as const },
            },
          ],
        },
        {
          role: "assistant" as const,
          content: "Got it — I see the document. Ask me anything about it.",
        },
      ]
    : [];

  Sentry.addBreadcrumb({
    category: "ai",
    message: "assistant.stream",
    data: { plan, userId: userId || "anon", turns: messages.length, hasContext: !!documentContext?.html },
    level: "info",
  });

  const startedAt = Date.now();
  let stream: AsyncIterable<Anthropic.MessageStreamEvent>;
  try {
    stream = await anthropic.messages.create({
      model: plan === "pro" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      stream: true,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [...contextNote, ...messages],
    });
  } catch (err) {
    Sentry.captureException(err);
    return c.json({ error: "AI unavailable. Please try again." }, 502);
  }

  // Count this request now — even partial streams cost tokens.
  await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullText = "";
      let inputTokens = 0;
      let outputTokens = 0;
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            controller.enqueue(encoder.encode(sse("token", { text: event.delta.text })));
          } else if (event.type === "message_start") {
            inputTokens = event.message.usage?.input_tokens ?? 0;
          } else if (event.type === "message_delta") {
            outputTokens = event.usage?.output_tokens ?? outputTokens;
          }
        }
        const duration = Date.now() - startedAt;
        controller.enqueue(
          encoder.encode(
            sse("done", {
              durationMs: duration,
              inputTokens,
              outputTokens,
              limit,
              remaining: Math.max(0, limit - used - 1),
            })
          )
        );
        Sentry.addBreadcrumb({
          category: "ai",
          message: "assistant.stream.success",
          data: { durationMs: duration, inputTokens, outputTokens, plan },
          level: "info",
        });
      } catch (err) {
        Sentry.captureException(err);
        controller.enqueue(encoder.encode(sse("error", { message: "Stream interrupted." })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(Math.max(0, limit - used - 1)),
    },
  });
});

app.get("/quota", optionalAuth, async (c) => {
  const userId = c.get("userId");
  let plan: "free" | "pro" = "free";
  if (userId) {
    const db = getDb(c.env.DB);
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (user) plan = user.plan;
  }
  const day = new Date().toISOString().slice(0, 10);
  const limit = userId ? (plan === "pro" ? PRO_LIMIT : FREE_LIMIT) : ANON_LIMIT;
  const rateId = userId || `ip:${c.req.header("CF-Connecting-IP") || "anon"}`;
  const rateKey = `ratelimit:assistant:${rateId}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  return c.json({ plan, limit, used, remaining: Math.max(0, limit - used) });
});

export default app;
