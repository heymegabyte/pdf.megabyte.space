import { Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import {
  buildSessionCookie,
  clearSessionCookie,
  createSession,
  deleteSession,
  findUserBySession,
  generatePkce,
  parseCookies,
  randomId,
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
} from "../lib/auth";
import { sendEmail } from "../lib/emails";
import type { Env, Variables } from "../types";

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

const STATE_TTL_SEC = 600;

const redirectUri = (env: Env): string => `${env.APP_URL.replace(/\/+$/, "")}/api/auth/google/callback`;

auth.get("/google", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) return c.json({ error: "Google sign-in not configured" }, 503);

  const state = randomId(24);
  const { verifier, challenge } = await generatePkce();
  const url = new URL(c.req.url);
  const next = url.searchParams.get("next") || "/dashboard";

  await c.env.CACHE.put(
    `oauth:state:${state}`,
    JSON.stringify({ verifier, next }),
    { expirationTtl: STATE_TTL_SEC }
  );

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(c.env),
    response_type: "code",
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
});

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface IdTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

const decodeIdToken = (idToken: string): IdTokenPayload | null => {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4 === 0 ? "" : "=".repeat(4 - (payload.length % 4));
    return JSON.parse(atob(payload + pad)) as IdTokenPayload;
  } catch {
    return null;
  }
};

auth.get("/google/callback", async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");
  if (errParam) return c.redirect(`/sign-in?error=${encodeURIComponent(errParam)}`, 302);
  if (!code || !state) return c.redirect("/sign-in?error=missing_code", 302);

  const stateKey = `oauth:state:${state}`;
  const stored = await c.env.CACHE.get(stateKey);
  if (!stored) return c.redirect("/sign-in?error=expired_state", 302);
  await c.env.CACHE.delete(stateKey);

  const { verifier, next } = JSON.parse(stored) as { verifier: string; next: string };

  let tokens: TokenResponse;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri(c.env),
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      Sentry.captureMessage(`google token exchange failed: ${tokenRes.status} ${body}`, "error");
      return c.redirect("/sign-in?error=token_exchange", 302);
    }
    tokens = (await tokenRes.json()) as TokenResponse;
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "auth", step: "token_exchange" } });
    return c.redirect("/sign-in?error=token_exchange", 302);
  }

  const claims = decodeIdToken(tokens.id_token);
  if (!claims?.sub || !claims.email) return c.redirect("/sign-in?error=missing_claims", 302);
  if (claims.email_verified === false) return c.redirect("/sign-in?error=email_unverified", 302);

  const db = getDb(c.env.DB);
  const now = new Date();
  const accessExp = new Date(Date.now() + tokens.expires_in * 1000);

  const existingBySub = await db.query.users.findFirst({
    where: eq(schema.users.googleSub, claims.sub),
  });

  let userId: string;

  if (existingBySub) {
    userId = existingBySub.id;
    await db
      .update(schema.users)
      .set({
        name: claims.name ?? existingBySub.name,
        imageUrl: claims.picture ?? existingBySub.imageUrl,
        googleAccessToken: tokens.access_token,
        googleAccessTokenExpiresAt: accessExp,
        ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
        updatedAt: now,
      })
      .where(eq(schema.users.id, userId));
  } else {
    const existingByEmail = await db.query.users.findFirst({
      where: eq(schema.users.email, claims.email),
    });

    if (existingByEmail) {
      userId = existingByEmail.id;
      await db
        .update(schema.users)
        .set({
          googleSub: claims.sub,
          name: claims.name ?? existingByEmail.name,
          imageUrl: claims.picture ?? existingByEmail.imageUrl,
          googleAccessToken: tokens.access_token,
          googleAccessTokenExpiresAt: accessExp,
          ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
          updatedAt: now,
        })
        .where(eq(schema.users.id, userId));
    } else {
      userId = `usr_${randomId(12)}`;
      await db.insert(schema.users).values({
        id: userId,
        email: claims.email,
        name: claims.name ?? null,
        imageUrl: claims.picture ?? null,
        googleSub: claims.sub,
        googleAccessToken: tokens.access_token,
        googleAccessTokenExpiresAt: accessExp,
        googleRefreshToken: tokens.refresh_token ?? null,
        welcomeSentAt: new Date(),
        updatedAt: now,
      });
      // Fire welcome email after user is created. waitUntil keeps the response fast
      // and lets Listmonk respond on its own clock.
      const newUserId = userId;
      c.executionCtx.waitUntil(
        sendEmail(c.env, {
          userId: newUserId,
          template: "welcome",
          dedupKey: `welcome:${newUserId}`,
          data: {
            signin_method: "google",
            dashboard_url: `${c.env.APP_URL}/dashboard`,
          },
        }).catch((err) => {
          Sentry.captureException(err, { tags: { trigger: "welcome_email", userId: newUserId } });
        })
      );
    }
  }

  const cookieValue = await createSession(c.env, userId);
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  c.header(
    "Set-Cookie",
    buildSessionCookie(cookieValue, { maxAgeSec: SESSION_TTL_DAYS * 24 * 60 * 60 })
  );
  return c.redirect(safeNext, 302);
});

auth.post("/signout", async (c) => {
  const cookies = parseCookies(c.req.header("Cookie"));
  const cookie = cookies[SESSION_COOKIE];
  if (cookie) {
    const result = await findUserBySession(c.env, cookie);
    if (result) await deleteSession(c.env, result.sessionId);
  }
  c.header("Set-Cookie", clearSessionCookie());
  return c.json({ ok: true });
});

export default auth;
