import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { DEFAULT_PREFS, parsePrefs, buildUnsubscribeUrl } from "../lib/emails";
import { listmonkBlocklistByEmail } from "../lib/listmonk";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const prefsSchema = z.object({
  transactional: z.boolean().optional(),
  product: z.boolean().optional(),
  digest: z.boolean().optional(),
  marketing: z.boolean().optional(),
  community: z.boolean().optional(),
  boost: z.boolean().optional(),
});

app.get("/prefs", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ prefs: parsePrefs(user.emailPrefs), email: user.email });
});

app.patch("/prefs", requireAuth, zValidator("json", prefsSchema), async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) return c.json({ error: "User not found" }, 404);
  const current = parsePrefs(user.emailPrefs);
  const next = { ...current, ...c.req.valid("json") };
  // Transactional is always on for compliance — security, billing, account changes.
  next.transactional = true;
  await db
    .update(schema.users)
    .set({ emailPrefs: JSON.stringify(next) })
    .where(eq(schema.users.id, userId));
  return c.json({ prefs: next });
});

// Signed-token one-click unsubscribe. No login required (Gmail/Yahoo 2024).
app.get("/unsubscribe", async (c) => {
  const token = c.req.query("u");
  const category = c.req.query("c") ?? "all";
  if (!token) return c.text("Missing token", 400);

  let payload: { userId: string; sig: string };
  try {
    const decoded = atob(token);
    const [userId, sig] = decoded.split(":");
    if (!userId || !sig) throw new Error("malformed");
    payload = { userId, sig };
  } catch {
    return c.text("Invalid unsubscribe link", 400);
  }

  const db = getDb(c.env.DB);
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, payload.userId) });
  if (!user) return c.text("Unknown user", 404);

  const expected = await buildUnsubscribeUrl(c.env, user.id, user.email);
  if (!expected.includes(payload.sig)) return c.text("Invalid signature", 403);

  const current = parsePrefs(user.emailPrefs);
  if (category === "all") {
    for (const key of Object.keys(current) as Array<keyof typeof current>) {
      if (key !== "transactional") current[key] = false;
    }
  } else if (category in current && category !== "transactional") {
    (current as unknown as Record<string, boolean>)[category] = false;
  }
  await db
    .update(schema.users)
    .set({ emailPrefs: JSON.stringify(current) })
    .where(eq(schema.users.id, user.id));

  // Honor Yahoo/Gmail spec by also blocklisting in Listmonk for marketing-class lists.
  c.executionCtx.waitUntil(
    listmonkBlocklistByEmail(c.env, user.email).catch((err) => {
      Sentry.captureException(err, { tags: { route: "unsubscribe" } });
    })
  );

  return c.html(unsubscribePage(user.email, category, current as unknown as Record<string, boolean>));
});

// One-click POST handler for List-Unsubscribe-Post: List-Unsubscribe=One-Click
app.post("/unsubscribe", async (c) => {
  const token = c.req.query("u");
  if (!token) return c.text("Missing token", 400);
  try {
    const decoded = atob(token);
    const [userId, sig] = decoded.split(":");
    if (!userId || !sig) throw new Error("malformed");
    const db = getDb(c.env.DB);
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user) return c.text("Unknown user", 404);
    const expected = await buildUnsubscribeUrl(c.env, user.id, user.email);
    if (!expected.includes(sig)) return c.text("Invalid signature", 403);
    const current = parsePrefs(user.emailPrefs);
    for (const key of Object.keys(current) as Array<keyof typeof current>) {
      if (key !== "transactional") current[key] = false;
    }
    await db
      .update(schema.users)
      .set({ emailPrefs: JSON.stringify(current) })
      .where(eq(schema.users.id, user.id));
    c.executionCtx.waitUntil(listmonkBlocklistByEmail(c.env, user.email).catch(() => {}));
    return c.text("OK", 200);
  } catch {
    return c.text("Invalid", 400);
  }
});

// Admin-only preview: render a stored email_events row back as JSON for QA.
app.get("/preview/:dedupKey", optionalAuth, async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Auth required" }, 401);
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user || user.email !== c.env.ADMIN_EMAIL) return c.json({ error: "Forbidden" }, 403);
  const evt = await db.query.emailEvents.findFirst({
    where: eq(schema.emailEvents.dedupKey, c.req.param("dedupKey")),
  });
  if (!evt) return c.json({ error: "Not found" }, 404);
  return c.json(evt);
});

function unsubscribePage(email: string, category: string, prefs: Record<string, boolean>): string {
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
    );
  const niceCat = category === "all" ? "all non-transactional email" : `${category} email`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed · Megabyte PDF</title>
<style>:root{color-scheme:dark}body{margin:0;background:#060610;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px}.card{background:#10102a;border:1px solid #1f1f3a;border-radius:18px;padding:36px;max-width:520px;width:100%;text-align:center}.h1{font-size:28px;font-weight:700;margin:0 0 8px;color:#00E5FF}.lede{color:#cbd0e9;font-size:16px;line-height:1.55;margin:0 0 18px}.email{font-family:'JetBrains Mono',monospace;color:#00E5FF;background:#060610;padding:6px 12px;border-radius:8px;display:inline-block;margin:6px 0}.small{color:#9aa0c3;font-size:13px;margin-top:18px}a{color:#00E5FF;text-decoration:none}a:hover{text-decoration:underline}</style>
</head><body><div class="card"><h1 class="h1">You're unsubscribed.</h1><p class="lede">We've muted ${escape(niceCat)} for <span class="email">${escape(email)}</span>. Transactional mail (account, billing, security) keeps flowing — those are legally required.</p><p class="small">Changed your mind? <a href="/account/email">Re-enable in preferences</a> · <a href="/">Back to Megabyte PDF</a></p></div></body></html>`;
}

export default app;
