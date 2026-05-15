import { getDb, schema } from "../db";
import { and, eq, gt } from "drizzle-orm";
import type { Env } from "../types";

/**
 * Session + OAuth primitives for the Worker.
 *
 * Sessions are server-side rows in D1 keyed by an opaque 32-byte id.
 * The id is HMAC-signed with `SESSION_SECRET` and shipped to the client
 * as the `__session` cookie. We never put user data in the cookie itself
 * — the cookie is just a tamper-evident pointer at a `sessions` row.
 *
 * All helpers are pure / async crypto wrappers around Workers' `crypto.subtle`
 * and live here so the OAuth route, the cron jobs, and route guards share
 * one implementation.
 */

/** Cookie name. Prefixed with `__` so browsers treat it as host-locked. */
export const SESSION_COOKIE = "__session";
/** Session lifetime in days. Rolled forward on each successful auth check. */
export const SESSION_TTL_DAYS = 30;
/** Session lifetime in ms (precomputed for `Date.now()` arithmetic). */
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();

/** URL-safe base64 (RFC 4648 §5) without padding. */
const b64urlEncode = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

/** Inverse of {@link b64urlEncode}. Restores padding before decoding. */
const b64urlDecode = (s: string): Uint8Array => {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const raw = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

/**
 * Cryptographically random opaque id, b64url-encoded.
 * Used for session ids, OAuth state nonces, and CSRF tokens.
 *
 * @param bytes Number of random bytes (default 32 → 256 bits of entropy).
 */
export const randomId = (bytes = 32): string =>
  b64urlEncode(crypto.getRandomValues(new Uint8Array(bytes)));

const hmacKey = async (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);

const hmac = async (secret: string, data: string): Promise<string> => {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(data));
  return b64urlEncode(sig);
};

/**
 * Constant-time string equality. Always walks the full input so the
 * caller can compare untrusted signatures without leaking length-prefix
 * information through timing.
 */
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

/**
 * Produce the value that goes into the `__session` cookie.
 * Format: `<sessionId>.<hmac>` — verifier splits on the LAST dot so the
 * session id can safely contain dot-free b64url characters.
 */
export const signSession = async (sessionId: string, secret: string): Promise<string> => {
  const sig = await hmac(secret, sessionId);
  return `${sessionId}.${sig}`;
};

/**
 * Verify a signed session cookie and return the session id on success.
 * Returns `null` for any tamper / malformed / missing-signature case so
 * callers can treat any non-null return as authenticated.
 */
export const verifySessionCookie = async (
  cookie: string,
  secret: string
): Promise<string | null> => {
  const idx = cookie.lastIndexOf(".");
  if (idx <= 0) return null;
  const sessionId = cookie.slice(0, idx);
  const sig = cookie.slice(idx + 1);
  const expected = await hmac(secret, sessionId);
  return timingSafeEqual(sig, expected) ? sessionId : null;
};

/** SHA-256(input), b64url-encoded. Used for PKCE challenge + token hashes. */
export const sha256 = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return b64urlEncode(digest);
};

/**
 * Build a `Set-Cookie` value for the session cookie.
 *
 * Defaults: `HttpOnly`, `SameSite=Lax`, `Secure`, `Path=/`.
 * Pass `secure: false` only for local-dev HTTP, never production.
 */
export const buildSessionCookie = (
  value: string,
  opts: { maxAgeSec?: number; secure?: boolean } = {}
): string => {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (opts.secure !== false) parts.push("Secure");
  if (opts.maxAgeSec !== undefined) parts.push(`Max-Age=${opts.maxAgeSec}`);
  return parts.join("; ");
};

/** Cookie value that instructs the browser to immediately drop the session cookie. */
export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;

/**
 * Parse an HTTP `Cookie` request header into a plain object.
 * Values are URI-decoded; unknown/malformed pairs are dropped silently.
 */
export const parseCookies = (header: string | null | undefined): Record<string, string> => {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
};

/**
 * Resolve a signed session cookie to the matching `{ user, sessionId }`.
 * Returns `null` for invalid signatures, missing sessions rows, expired
 * sessions, or sessions whose user has been deleted.
 */
export const findUserBySession = async (
  env: Env,
  sessionCookie: string
): Promise<{ user: typeof schema.users.$inferSelect; sessionId: string } | null> => {
  const sessionId = await verifySessionCookie(sessionCookie, env.SESSION_SECRET);
  if (!sessionId) return null;
  const db = getDb(env.DB);
  const now = new Date();
  const row = await db.query.sessions.findFirst({
    where: and(eq(schema.sessions.id, sessionId), gt(schema.sessions.expiresAt, now)),
  });
  if (!row) return null;
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, row.userId) });
  if (!user) return null;
  return { user, sessionId };
};

/**
 * Mint a new session row and return the signed cookie value.
 * Caller is responsible for sending the cookie back via `Set-Cookie`.
 */
export const createSession = async (env: Env, userId: string): Promise<string> => {
  const sessionId = randomId(32);
  const db = getDb(env.DB);
  await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return signSession(sessionId, env.SESSION_SECRET);
};

/** Delete a session row by id — used on explicit sign-out. */
export const deleteSession = async (env: Env, sessionId: string): Promise<void> => {
  const db = getDb(env.DB);
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
};

/**
 * Generate an OAuth 2.0 PKCE pair (RFC 7636).
 * `verifier` stays server-side (or is sent via an out-of-band channel),
 * `challenge` goes to the authorization endpoint as `code_challenge`.
 */
export const generatePkce = async (): Promise<{ verifier: string; challenge: string }> => {
  const verifier = b64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(verifier));
  return { verifier, challenge: b64urlEncode(digest) };
};

export { b64urlEncode, b64urlDecode, timingSafeEqual };
