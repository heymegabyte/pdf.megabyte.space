/**
 * Google Drive integration — OAuth token refresh + multipart PDF upload.
 *
 * Tokens are stored on the user row (`googleAccessToken`,
 * `googleAccessTokenExpiresAt`, `googleRefreshToken`). The refresh token is
 * obtained at sign-in and only rotates when Google forces a re-consent.
 *
 * Failures are swallowed and reported to Sentry — Drive export is opt-in and
 * must never block the rest of the PDF flow.
 */
import * as Sentry from "@sentry/cloudflare";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Env } from "../types";
import type { User } from "../db/schema";

interface RefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

const ACCESS_TOKEN_SLACK_MS = 60_000;

/**
 * Returns a valid Google access token for `user`, refreshing via the stored
 * refresh token when the cached one is expired (or within 60s of expiry).
 *
 * Returns `null` when refresh fails or the user never granted offline access.
 * Callers must treat `null` as "Drive export unavailable for this user" and
 * surface a re-auth prompt rather than retrying.
 */
export const ensureFreshAccessToken = async (env: Env, user: User): Promise<string | null> => {
  const expires = user.googleAccessTokenExpiresAt?.getTime() ?? 0;
  if (user.googleAccessToken && expires - ACCESS_TOKEN_SLACK_MS > Date.now()) {
    return user.googleAccessToken;
  }
  if (!user.googleRefreshToken) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: user.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      Sentry.captureMessage(`drive token refresh failed: ${res.status} ${body}`, "warning");
      return null;
    }
    const json = (await res.json()) as RefreshResponse;
    const newExp = new Date(Date.now() + json.expires_in * 1000);
    const db = getDb(env.DB);
    await db
      .update(schema.users)
      .set({
        googleAccessToken: json.access_token,
        googleAccessTokenExpiresAt: newExp,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
    return json.access_token;
  } catch (err) {
    Sentry.captureException(err, { tags: { lib: "drive", step: "refresh" } });
    return null;
  }
};

interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
}

/**
 * Uploads a PDF buffer to the user's Drive root via the multipart upload API.
 * Throws on non-2xx — callers wrap in try/catch and report to Sentry.
 *
 * The boundary is randomised per request to defeat any intermediate caching.
 * Response includes `webViewLink` (browser preview) + `webContentLink`
 * (direct download); both are stable as long as the file isn't moved.
 */
export const uploadPdfToDrive = async (
  accessToken: string,
  filename: string,
  pdf: Uint8Array
): Promise<DriveUploadResult> => {
  const boundary = `mb_${crypto.randomUUID()}`;
  const meta = JSON.stringify({ name: filename, mimeType: "application/pdf" });

  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`
  );
  const tail = enc.encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(head.length + pdf.length + tail.length);
  body.set(head, 0);
  body.set(pdf, head.length);
  body.set(tail, head.length + pdf.length);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`drive upload failed: ${res.status} ${text}`);
  }
  return (await res.json()) as DriveUploadResult;
};
