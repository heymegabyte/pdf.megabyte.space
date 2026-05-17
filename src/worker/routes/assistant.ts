import { Hono } from "hono";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/cloudflare";
import { optionalAuth } from "../middleware/auth";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";
import type { Env, Variables } from "../types";
import { ASSISTANT_RATE_LIMITS, isPaid, type Plan } from "../../shared/plans";
import { RENDER_WIDGET_TOOL, validateWidget, WidgetValidationError } from "../lib/widget-schema";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const pageContextSchema = z
  .object({
    path: z.string().max(200).optional(),
    title: z.string().max(200).optional(),
    summary: z.string().max(400).optional(),
    headings: z.array(z.string().max(200)).max(8).optional(),
    selection: z.string().max(2000).optional(),
  })
  .optional();

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  thread: z.string().min(1).max(64).optional(),
  pageContext: pageContextSchema,
  documentContext: z
    .object({ title: z.string().max(200).optional(), html: z.string().max(20000).optional() })
    .optional(),
});

const SYSTEM = `You are Megabyte Assist, the in-product AI concierge for Megabyte PDF (https://pdf.megabyte.space) — a chat-to-PDF SaaS built on Cloudflare Workers.

Your job:
- Answer questions about Megabyte PDF features, plans (Guest, Free, Pro $9/mo, Unlimited $50/mo), and pricing.
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

Slash commands the user can type in this chat (suggest one inline when it answers the question faster than prose):
- Sales: /pricing (plans + CTAs) · /compare (vs PandaDoc/DocuSign/Adobe) · /book (talk to us) · /features (capability grid)
- Content: /invoice · /resume · /proposal · /contract · /cover-letter · /report (each scaffolds a richer prompt)
- Editor: /summarize · /improve · /explain · /page-break (operate on the current document)
- Tools: /new · /clear · /export · /copy · /stop · /regenerate · /share · /settings · /feedback
- Navigation: /home · /dashboard · /explore · /templates · /blog · /privacy · /terms
- Account: /signin · /account · /upgrade · /billing · /signout
- Support: /help · /faq · /docs · /status · /changelog · /shortcuts · /newsletter · /podcast · /accessibility · /support · /search
When you mention one, write it as plain text like \`/pricing\` (single backticks). Do NOT fabricate slash commands that aren't in this list.

When the user is on a specific page or editing a document, the client may include documentContext + pageContext. Treat pageContext.path as ground truth for where the user is right now and tailor every answer to that route. Examples: on \`/p/<id>\` (the editor) lean on \`/improve\`, \`/summarize\`, \`/page-break\`; on \`/dashboard\` lean on \`/upgrade\`, \`/billing\`, \`/templates\`; on \`/templates*\` lean on \`/invoice\`, \`/resume\`, \`/contract\`; on \`/explore\` or \`/c/<slug>\` lean on \`/search\`, \`/templates\`; on \`/blog*\` or \`/podcast*\` lean on \`/newsletter\`, \`/podcast\`; on \`/sign-in\` or \`/guest\` lean on \`/signin\`, \`/compare\`. Never recommend a route the user is already on.

Rich widgets (PREFERRED for structured answers): you have a \`render_widget\` tool. Call it instead of writing markdown when the answer is structured — pricing tables, FAQs, link lists, step-by-step guides, stat grids, comparison tables, CTAs, callouts, search results. The widget renders inline below any prose you've already streamed. Available kinds: text, markdown, callout, cta, link-list, card, card-grid, pricing, feature-grid, faq, table, code, stat-grid, checklist, steps, photo, gallery, video, quote, person, sources, suggestions, shortcommands, chart, timeline, rating, status, form, search-results, alert, breadcrumb, multi-choice, before-after, document. Rules: (1) write a one-sentence intro before calling the tool so the user knows what's coming. (2) use absolute URLs for external links, root-relative for internal (\`/pricing\`, \`/templates\`). (3) never invent prices, plans, or features — Free, Pro $9/mo, Unlimited $50/mo are the only plans. (4) at most ONE \`render_widget\` call per turn — pick the highest-signal widget for the question.

Few-shot examples (do these — they're the right shape):

Q: "What do the plans cost?"
A: One-sentence intro then \`render_widget\` with:
\`\`\`json
{"kind":"pricing","title":"Megabyte PDF plans","payload":{"plans":[
  {"name":"Free","price":"$0","period":"/mo","features":["10 PDFs/mo","Watermark","Community templates"],"ctaLabel":"Start free","ctaHref":"/sign-up"},
  {"name":"Pro","price":"$9","period":"/mo","features":["Unlimited PDFs","No watermark","Priority AI"],"ctaLabel":"Go Pro","ctaHref":"/upgrade","highlight":true},
  {"name":"Unlimited","price":"$50","period":"/mo","features":["Team seats","API access","White-label"],"ctaLabel":"Talk to us","ctaHref":"mailto:hey@megabyte.space"}
]}}
\`\`\`

Q: "How do page breaks work?"
A: One-sentence intro then \`render_widget\` with:
\`\`\`json
{"kind":"faq","title":"Page breaks","payload":{"items":[
  {"q":"How do I force a new page?","a":"Add CSS \`page-break-before: always\` (or \`break-before: page\` in modern browsers) on the element that should start a fresh page."},
  {"q":"Can I size the page differently?","a":"Yes — use \`@page { size: A4; }\` or \`@page { size: letter landscape; }\` in your CSS."},
  {"q":"Why is my last page blank?","a":"Trailing whitespace or a forced break at the very end. Remove a final empty paragraph or drop the break on the last child."}
]}}
\`\`\`

Q: "How does this compare to PandaDoc?"
A: One-sentence intro then \`render_widget\` with a \`table\` widget contrasting price + speed + features.`;

const { anon: ANON_LIMIT, free: FREE_LIMIT, pro: PRO_LIMIT, unlimited: UNLIMITED_LIMIT } = ASSISTANT_RATE_LIMITS;

function limitForPlan(userId: string | undefined, plan: Plan): number {
  if (!userId) return ANON_LIMIT;
  if (plan === "unlimited") return UNLIMITED_LIMIT;
  if (plan === "pro") return PRO_LIMIT;
  return FREE_LIMIT;
}

const sse = (event: string, data: unknown): string =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

app.post("/chat", optionalAuth, async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);
  const { messages, documentContext, pageContext } = parsed.data;

  const userId = c.get("userId");
  let plan: Plan = "free";
  if (userId) {
    const db = getDb(c.env.DB);
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (user) plan = user.plan;
  }

  const day = new Date().toISOString().slice(0, 10);
  const limit = limitForPlan(userId, plan);
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

  // Prepend optional context as a user-role "system context" message.
  const pageContextText = pageContext
    ? `CURRENT PAGE CONTEXT
Path: ${pageContext.path || "/"}
Title: ${pageContext.title || ""}
${pageContext.summary ? `Summary: ${pageContext.summary}\n` : ""}${
        pageContext.headings?.length ? `Headings:\n- ${pageContext.headings.join("\n- ")}\n` : ""
      }${pageContext.selection ? `\nUser selected text:\n"""\n${pageContext.selection}\n"""\n` : ""}`
    : "";

  const documentContextText = documentContext?.html
    ? `CURRENT DOCUMENT CONTEXT
Title: ${documentContext.title || "Untitled"}

\`\`\`html
${documentContext.html.slice(0, 12000)}
\`\`\``
    : "";

  const combinedContext = [pageContextText, documentContextText].filter(Boolean).join("\n\n");

  const contextNote = combinedContext
    ? [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: combinedContext,
              cache_control: { type: "ephemeral" as const },
            },
          ],
        },
        {
          role: "assistant" as const,
          content: documentContextText
            ? "Got it — I see the page and the document. Ask me anything."
            : "Got it — I see what page you're on. How can I help?",
        },
      ]
    : [];

  Sentry.addBreadcrumb({
    category: "ai",
    message: "assistant.stream",
    data: {
      plan,
      userId: userId || "anon",
      turns: messages.length,
      hasDocumentContext: !!documentContext?.html,
      hasPageContext: !!pageContext,
      path: pageContext?.path,
    },
    level: "info",
  });

  const startedAt = Date.now();
  let stream: AsyncIterable<Anthropic.MessageStreamEvent>;
  try {
    stream = await anthropic.messages.create({
      model: isPaid(plan) ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      stream: true,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [...contextNote, ...messages],
      tools: [RENDER_WIDGET_TOOL],
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
      let widgetsEmitted = 0;
      const toolBlocks = new Map<number, { name: string; jsonBuffer: string }>();
      try {
        for await (const event of stream) {
          if (event.type === "content_block_start") {
            if (event.content_block.type === "tool_use") {
              toolBlocks.set(event.index, { name: event.content_block.name, jsonBuffer: "" });
            }
          } else if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              fullText += event.delta.text;
              controller.enqueue(encoder.encode(sse("token", { text: event.delta.text })));
            } else if (event.delta.type === "input_json_delta") {
              const block = toolBlocks.get(event.index);
              if (block) block.jsonBuffer += event.delta.partial_json;
            }
          } else if (event.type === "content_block_stop") {
            const block = toolBlocks.get(event.index);
            if (block && block.name === "render_widget" && widgetsEmitted < 3) {
              try {
                const raw = block.jsonBuffer.trim() ? JSON.parse(block.jsonBuffer) : {};
                const widget = validateWidget(raw);
                controller.enqueue(encoder.encode(sse("widget", widget)));
                widgetsEmitted++;
              } catch (err) {
                Sentry.captureException(err, {
                  tags: { route: "assistant", subroute: "render_widget" },
                  extra: {
                    jsonBuffer: block.jsonBuffer.slice(0, 1000),
                    issues: err instanceof WidgetValidationError ? err.issues.slice(0, 5) : undefined,
                  },
                });
              }
              toolBlocks.delete(event.index);
            }
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
              widgetsEmitted,
              limit,
              remaining: Math.max(0, limit - used - 1),
            })
          )
        );
        Sentry.addBreadcrumb({
          category: "ai",
          message: "assistant.stream.success",
          data: {
            durationMs: duration,
            inputTokens,
            outputTokens,
            widgetsEmitted,
            plan,
            path: pageContext?.path,
            chars: fullText.length,
          },
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
  let plan: Plan = "free";
  if (userId) {
    const db = getDb(c.env.DB);
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (user) plan = user.plan;
  }
  const day = new Date().toISOString().slice(0, 10);
  const limit = limitForPlan(userId, plan);
  const rateId = userId || `ip:${c.req.header("CF-Connecting-IP") || "anon"}`;
  const rateKey = `ratelimit:assistant:${rateId}:${day}`;
  const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
  return c.json({ plan, limit, used, remaining: Math.max(0, limit - used) });
});

export default app;
