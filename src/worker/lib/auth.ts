import { getDb, schema } from "../db";
import { and, eq, gt } from "drizzle-orm";
import type { Env } from "../types";

export const SESSION_COOKIE = "__session";
export const SESSION_TTL_DAYS = 30;
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();

const b64urlEncode = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const b64urlDecode = (s: string): Uint8Array => {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const raw = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

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

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

export const signSession = async (sessionId: string, secret: string): Promise<string> => {
  const sig = await hmac(secret, sessionId);
  return `${sessionId}.${sig}`;
};

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

export const sha256 = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return b64urlEncode(digest);
};

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

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;

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

export const deleteSession = async (env: Env, sessionId: string): Promise<void> => {
  const db = getDb(env.DB);
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
};

export const generatePkce = async (): Promise<{ verifier: string; challenge: string }> => {
  const verifier = b64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(verifier));
  return { verifier, challenge: b64urlEncode(digest) };
};

export { b64urlEncode, b64urlDecode };
