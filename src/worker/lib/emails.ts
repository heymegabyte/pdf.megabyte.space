import * as Sentry from "@sentry/cloudflare";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Env } from "../types";
import { listmonkConfigured, listmonkSendTx } from "./listmonk";

/**
 * 14 canonical email templates. Each maps 1:1 to a Listmonk template alias and
 * to a category gate in users.email_prefs. The dispatcher refuses to send when
 * the gate is false or when (template_alias, dedup_key) has already been logged.
 */
export type EmailTemplate =
  | "welcome"
  | "first-pdf"
  | "free-limit"
  | "abandoned-prompt"
  | "weekly-digest"
  | "trending-milestone"
  | "win-back-30d"
  | "template-of-week"
  | "annual-summary"
  | "feature-drop"
  | "share-expiring"
  | "new-follower"
  | "privacy-report"
  | "ai-boost"
  | "onboard-day3-stuck"
  | "first-share"
  | "export-limit-pro"
  | "payment-failed"
  | "renewal-receipt"
  | "tip-of-the-week";

export type EmailCategory =
  | "transactional"
  | "product"
  | "digest"
  | "marketing"
  | "community"
  | "boost";

export const TEMPLATE_CATEGORIES: Record<EmailTemplate, EmailCategory> = {
  welcome: "transactional",
  "first-pdf": "transactional",
  "free-limit": "transactional",
  "abandoned-prompt": "product",
  "weekly-digest": "digest",
  "trending-milestone": "community",
  "win-back-30d": "marketing",
  "template-of-week": "digest",
  "annual-summary": "transactional",
  "feature-drop": "product",
  "share-expiring": "transactional",
  "new-follower": "community",
  "privacy-report": "transactional",
  "ai-boost": "boost",
  "onboard-day3-stuck": "product",
  "first-share": "community",
  "export-limit-pro": "boost",
  "payment-failed": "transactional",
  "renewal-receipt": "transactional",
  "tip-of-the-week": "digest",
};

export interface EmailPrefs {
  transactional: boolean;
  product: boolean;
  digest: boolean;
  marketing: boolean;
  community: boolean;
  boost: boolean;
}

export const DEFAULT_PREFS: EmailPrefs = {
  transactional: true,
  product: true,
  digest: true,
  marketing: true,
  community: true,
  boost: true,
};

export function parsePrefs(raw: string | null | undefined): EmailPrefs {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(raw) as Partial<EmailPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export interface SendEmailArgs {
  userId: string;
  template: EmailTemplate;
  /** Unique key per trigger event. Prevents double sends. */
  dedupKey: string;
  data: Record<string, unknown>;
}

const randomId = (n = 16): string => {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
};

const HMAC_HEX = async (secret: string, msg: string): Promise<string> => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
};

/** Build a signed unsubscribe URL that needs no login. */
export async function buildUnsubscribeUrl(
  env: Env,
  userId: string,
  email: string
): Promise<string> {
  const secret = env.EMAIL_UNSUB_SECRET ?? env.SESSION_SECRET ?? "fallback-not-prod";
  const payload = `${userId}:${email}`;
  const sig = (await HMAC_HEX(secret, payload)).slice(0, 32);
  const token = btoa(`${userId}:${sig}`).replace(/=+$/, "");
  return `${env.APP_URL}/api/email/unsubscribe?u=${encodeURIComponent(token)}`;
}

/**
 * The one dispatcher. Refuses to send if:
 *   - listmonk is not configured (degrades silently in dev)
 *   - user opted out of the template's category
 *   - dedupKey was used before (race-safe via UNIQUE constraint)
 *
 * Returns an `{ok, status}` result and always records an `email_events` row.
 */
export async function sendEmail(env: Env, args: SendEmailArgs): Promise<{ ok: boolean; reason?: string }> {
  const db = getDb(env.DB);
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, args.userId) });
  if (!user) return { ok: false, reason: "user_not_found" };

  const prefs = parsePrefs(user.emailPrefs);
  const category = TEMPLATE_CATEGORIES[args.template];

  // Transactional always wins for legal/compliance items the user explicitly opted into
  // (welcome, receipts, security). Everything else respects the per-category gate.
  if (category !== "transactional" && !prefs[category]) {
    await logEvent(env, args.userId, args.template, args.dedupKey, "skipped", null, "opted_out");
    return { ok: false, reason: "opted_out" };
  }

  // Dedup check (race-safe via the UNIQUE constraint on dedup_key).
  try {
    await db.insert(schema.emailEvents).values({
      id: `evt_${randomId(10)}`,
      userId: args.userId,
      template: args.template,
      dedupKey: args.dedupKey,
      status: "queued",
      payload: JSON.stringify(args.data),
    });
  } catch (err) {
    // UNIQUE collision = already sent (or in flight).
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return { ok: false, reason: "duplicate" };
    Sentry.captureException(err, { tags: { email_template: args.template, step: "dedup_insert" } });
    return { ok: false, reason: "db_error" };
  }

  if (!listmonkConfigured(env)) {
    await logEvent(env, args.userId, args.template, args.dedupKey, "skipped", null, "listmonk_not_configured");
    return { ok: false, reason: "listmonk_not_configured" };
  }

  // Inject universal variables every template can render: brand, recipient,
  // unsubscribe link, current year. Per-template data lives in `event`.
  const unsubUrl = await buildUnsubscribeUrl(env, user.id, user.email);
  const universalData = {
    app_name: env.APP_NAME,
    app_url: env.APP_URL,
    brand_color: "#00E5FF",
    accent_color: "#7C3AED",
    bg_color: "#060610",
    year: new Date().getFullYear(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? user.email.split("@")[0],
      first_name: (user.name ?? user.email.split("@")[0])!.split(" ")[0],
      plan: user.plan,
      avatar: user.imageUrl ?? null,
    },
    unsubscribe_url: unsubUrl,
    prefs_url: `${env.APP_URL}/account/email`,
  };

  const res = await listmonkSendTx(env, {
    subscriberEmail: user.email,
    templateAlias: args.template,
    data: { ...universalData, event: args.data },
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>, <mailto:${env.LISTMONK_FROM_EMAIL ?? "hello@megabyte.space"}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Megabyte-Template": args.template,
      "X-Megabyte-Dedup": args.dedupKey,
    },
  });

  if (res.ok) {
    await logEvent(env, args.userId, args.template, args.dedupKey, "sent", null, null);
  } else {
    await logEvent(env, args.userId, args.template, args.dedupKey, "failed", null, res.error ?? null);
    Sentry.captureMessage("listmonk send failed", {
      level: "warning",
      tags: { template: args.template, status: String(res.status) },
      extra: { error: res.error, dedupKey: args.dedupKey },
    });
  }
  return { ok: res.ok, reason: res.error };
}

async function logEvent(
  env: Env,
  userId: string,
  template: EmailTemplate,
  dedupKey: string,
  status: "queued" | "sent" | "failed" | "skipped",
  providerId: string | null,
  errorOrReason: string | null
): Promise<void> {
  const db = getDb(env.DB);
  try {
    await db
      .update(schema.emailEvents)
      .set({
        status,
        providerId: providerId ?? undefined,
        error: errorOrReason ?? undefined,
        sentAt: status === "sent" ? new Date() : undefined,
      })
      .where(eq(schema.emailEvents.dedupKey, dedupKey));
  } catch {
    // best-effort
    void userId;
    void template;
  }
}
