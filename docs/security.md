# Security

How Megabyte PDF defends itself: CSP, auth, rate limiting, secret hierarchy, and the OWASP Top-10 coverage that informs day-to-day choices.

## Threat model

The Worker is the entire backend, so the attack surface is unusually small but unusually concentrated:

- **User-authored HTML/CSS** — the editor accepts arbitrary HTML/CSS and renders it to PDF via headless Chrome. Anything that escapes the render context could exfiltrate user data.
- **Public preview iframes** — `/c/:slug` and `/s/:slug/render` host third-party content inside our origin. An attacker who controls a PDF could phish other users.
- **Google OAuth** — the only auth path. A bypass = full account takeover.
- **Listmonk write API** — the API user can mutate subscriber data. A leaked token = mass-mail spam.
- **Anthropic / Stripe / Sentry tokens** — direct cost or PII exposure if leaked.

Out of scope: DDoS at the edge (Cloudflare handles it), physical access to admin laptops, supply-chain compromise of the Worker runtime itself.

## Content Security Policy

`src/worker/index.ts:51` defines `strictSecureHeaders` using `hono/secure-headers`. It applies to every request **except** PDF render endpoints, which set their own scoped CSP in-handler.

### Global strict CSP

```ts
defaultSrc: ["'self'"]
scriptSrc: ["'self'", "'unsafe-inline'", GTM, Stripe.js, Turnstile, PostHog, CF Insights]
connectSrc: ["'self'", Sentry, PostHog, GA, Stripe API, Google OAuth, CF Insights]
imgSrc:     ["'self'", "data:", GTM, GA, Google avatar CDN]
frameSrc:   ["'self'", GTM, Stripe checkout, Turnstile, accounts.google.com]
fontSrc:    ["'self'", fonts.gstatic.com]
styleSrc:   ["'self'", "'unsafe-inline'", fonts.googleapis.com]
baseUri:    ["'self'"]
objectSrc:  ["'none'"]
reportUri:  https://sentry.megabyte.space/api/security/?sentry_key=megabyte-pdf
```

Plus `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

**`'unsafe-inline'`** is unavoidable today:

- `styleSrc` — Tailwind 4 injects runtime CSS-in-JS via inline `<style>` tags.
- `scriptSrc` — GTM, Stripe.js, and the bootstrap JSON blob (`window.__APP_CONFIG__`) all use inline scripts.

Move to nonce-based CSP once we drop inline analytics (open task — no timeline).

### Why `frame-src 'self'`

The community-PDF iframe at `/c/:slug` embeds `/api/public/:slug/render`. Dropping `'self'` from `frame-src` → browser refuses the embed → users see a broken-document icon despite the render endpoint returning a 200. Memory pin: `project_csp_frame_src_self.md`.

### Render-endpoint CSP override

`isUserRenderPath()` matches `/api/public/:slug/render` and `/s/:slug/render`. Those paths skip `strictSecureHeaders` entirely and the handler attaches its own permissive CSP:

```ts
Content-Security-Policy:
  default-src 'self';
  img-src 'self' data: blob: https:;
  style-src 'self' 'unsafe-inline';
  font-src 'self' https:;
  connect-src 'none';
  script-src 'none';
  object-src 'none';
  frame-ancestors 'self';
  sandbox allow-same-origin
```

Key invariants:

- **`script-src 'none'`** — user-authored HTML cannot execute JavaScript. Editor exports are documents, not apps.
- **`connect-src 'none'`** — even if a script slipped in, it couldn't beacon out.
- **`frame-ancestors 'self'`** — only `pdf.megabyte.space` can embed the iframe.
- **`img-src https:`** — broad enough to display photos from any HTTPS source the user pastes in; data:/blob: cover inline base64.

### Other headers

```
X-Frame-Options                 disabled (deprecated; covered by frame-ancestors)
X-XSS-Protection                disabled (deprecated; modern browsers ignore it)
X-Content-Type-Options          nosniff (default from hono/secure-headers)
Referrer-Policy                 strict-origin-when-cross-origin (default)
Permissions-Policy              minimal — no camera/microphone/geolocation
Cross-Origin-Opener-Policy      disabled — Google OAuth popup needs to talk back
Cross-Origin-Embedder-Policy    disabled — iframe embedding requires it
Cross-Origin-Resource-Policy    disabled — same reason
```

The Stripe + Google popups would fail under `COOP: same-origin`. Re-enable only after replacing both with redirect flows.

## Auth

`src/worker/lib/auth.ts` is the only auth surface. There is no password, no token-based API auth — every authenticated request rides a signed session cookie.

### Session lifecycle

1. User clicks **Sign in with Google** → Worker initiates OAuth 2.0 with PKCE.
2. Callback validates state + nonce, fetches user info from `https://www.googleapis.com/oauth2/v3/userinfo`.
3. Worker upserts `users` row (keyed by Google `sub`), creates a `sessions` row with 30-day expiry.
4. `sessionId` is HMAC-signed with `SESSION_SECRET` → `<sessionId>.<sig>` becomes the `__session` cookie:
   ```
   Set-Cookie: __session=<id>.<sig>; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=2592000
   ```
5. Every subsequent request: `findUserBySession()` verifies the HMAC in constant time, then looks up the session row and asserts `expiresAt > now`.

### Properties

- **HttpOnly** — JavaScript cannot read the cookie. XSS in the editor surface can't steal sessions.
- **SameSite=Lax** — CSRF protection out-of-the-box. State-changing requests must originate from `pdf.megabyte.space`.
- **Secure** — never sent over HTTP. Local dev (`secure: false`) is the only exception.
- **HMAC-SHA-256** — `SESSION_SECRET` is 32 bytes of `openssl rand -hex`. Rotating it logs everyone out.
- **Timing-safe comparison** — `timingSafeEqual()` prevents byte-by-byte signature leaks.
- **DB-backed expiry** — even if a cookie is replayed, the session row's `expiresAt` is authoritative.

### Plan / role checks

Plans are an enum on `users.plan` (`free` / `pro` / `unlimited`). Quotas are enforced at the route level (`projectLimit()` in `src/worker/index.ts`). No admin role exists — `ADMIN_EMAIL` gates `/api/admin/plan` for self-service plan toggles in test environments.

### OAuth state + PKCE

`generatePkce()` produces a 32-byte verifier + SHA-256 challenge. State is a random 32-byte token. Both round-trip through a `state` cookie set on the redirect and validated on callback. A mismatched state aborts the flow with a 400.

## Rate limiting

KV-backed counters with daily granularity. Pattern:

```ts
const ip = c.req.header("CF-Connecting-IP") || "anon";
const day = new Date().toISOString().slice(0, 10);
const rateKey = `ratelimit:<feature>:${ip}:${day}`;
const used = Number((await c.env.CACHE.get(rateKey)) ?? "0");
if (used >= LIMIT) return c.json({ error: "Too many requests today." }, 429);
await c.env.CACHE.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });
```

Active limiters:

| Feature                       | Limit                | Notes                                       |
| ----------------------------- | -------------------- | ------------------------------------------- |
| `newsletter.subscribe`        | 10/IP/day            | Footer signup                                |
| `podcast.subscribe`           | 10/IP/day            | Waitlist                                     |
| `share.create`                | 50/user/day          | Authenticated — key on userId, not IP        |
| `chat.complete`               | per-plan (free=10/day, pro=200/day, unlimited=∞) | Authenticated      |
| `export.render`               | per-plan, same tiers | CPU-expensive; degrades to 402 on overage    |
| `auth.callback`               | 20/IP/15min          | Failed OAuth flooding                        |

KV is eventually consistent globally, so a determined attacker hitting multiple Cloudflare PoPs can spike beyond the cap. Acceptable today because the worst-case (10 → ~50 signups before convergence) is still inside the noise budget. If abuse grows, swap to Durable Objects.

## Secret management

Hierarchy (highest priority first):

1. **`wrangler secret`** — production runtime. Set with `wrangler secret put NAME`. Never echoed back.
2. **`.dev.vars`** — local dev. Gitignored. Same names as production.
3. **`wrangler.toml [vars]`** — public, non-secret config. Anything here is visible in the deployed Worker.

Rules:

- Never commit `.dev.vars`.
- Never put secrets in `[vars]` — they end up in `git log` and the Worker tail output.
- Rotate `SESSION_SECRET`, `EMAIL_UNSUB_SECRET`, `LISTMONK_API_TOKEN`, and `STRIPE_WEBHOOK_SECRET` annually or after any suspected exposure.
- Anthropic / Google / Stripe keys: rotate within 1 hour of a leak, then revoke the old one.

### What lives where

| Secret                    | Where                                | What rotates touch                              |
| ------------------------- | ------------------------------------ | ----------------------------------------------- |
| `SESSION_SECRET`          | `wrangler secret`                    | Logs all users out                              |
| `GOOGLE_CLIENT_SECRET`    | `wrangler secret`                    | New OAuth app — coordinate with Google console  |
| `ANTHROPIC_API_KEY`       | `wrangler secret`                    | Chat + assistant endpoints                       |
| `STRIPE_SECRET_KEY` / `_WEBHOOK_SECRET` | `wrangler secret`        | Billing flows; webhook signing                  |
| `LISTMONK_API_TOKEN`      | `wrangler secret`                    | Email pipeline                                   |
| `EMAIL_UNSUB_SECRET`      | `wrangler secret`                    | Unsubscribe link HMAC — rotation breaks live links |
| `SENTRY_DSN` / `_CLIENT`  | `wrangler secret`                    | Error reporting silenced if unset                |
| `CF_ZONE_ID` (deploy.sh)  | shell env or `.envrc`                | Cache purge                                      |

## Webhook verification

`POST /api/billing/webhook` validates Stripe signatures via `stripe.webhooks.constructEventAsync()` using `STRIPE_WEBHOOK_SECRET`. Reject any request whose signature fails verification with 400, no body. Idempotency is enforced by writing the Stripe event id into a deduplication KV key — replays are no-ops.

No other webhooks exist. If you add Listmonk webhooks later, copy the Stripe pattern: dedicated secret, HMAC verification, idempotency key, log every reject to Sentry with the raw signature header for forensic value.

## Input validation

Every public endpoint pipes its body through `@hono/zod-validator`:

```ts
const bodySchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(64).optional(),
});

app.post("/subscribe", zValidator("json", bodySchema), async (c) => { ... });
```

Rules:

- **Always cap string lengths.** Listmonk + D1 both happily accept 1MB strings — clients shouldn't.
- **Always validate emails with `.email()`** — saves a downstream Listmonk 400.
- **Reject unknown keys** when the surface is tight (set `.strict()` on schemas where you know all valid fields).
- **D1 queries** — always Drizzle. Never string-interpolate SQL. The ORM parameterises everything.

Drizzle's prepared statements + parameter binding make SQL injection a non-issue as long as no one drops down to raw `db.execute(sql.raw(\`SELECT ...\`))`. If you ever do, sanitise inputs first.

## XSS

User-authored HTML is rendered inside the **render endpoints only**, where `script-src 'none'` blocks execution. The editor's WYSIWYG canvas runs the same HTML in the main app context, but:

- The CSP forbids inline event handlers via `script-src` (`'unsafe-inline'` covers `<script>` blocks, not inline `onclick=`).
- React escapes interpolated content by default.
- The CodeMirror panel is a controlled input — no `dangerouslySetInnerHTML` in production code.

If the editor ever switches to `srcdoc=` for a live in-app preview, the surrounding CSP no longer protects it. Render previews must stay in the iframe.

## CSRF

`SameSite=Lax` is the primary defence. State-changing POSTs from a third-party origin won't carry the session cookie. Login OAuth callback uses a `state` cookie nonce.

Where this falls down: top-level GET-driven navigation can still carry the cookie. We don't expose state-changing GETs, but if you ever add one (e.g. `/api/projects/:id/delete`), convert to POST first.

## OWASP Top 10 (2025) coverage

| Risk                                   | Status   | Where it's handled                                                    |
| -------------------------------------- | -------- | --------------------------------------------------------------------- |
| A01 Broken Access Control              | OK       | Auth middleware on every authenticated route; soft-delete on projects |
| A02 Cryptographic Failures             | OK       | HMAC-SHA-256 sessions, TLS at edge, secrets never echoed              |
| A03 Injection                          | OK       | Drizzle parameterised queries; Zod validation; CSP `script-src 'none'` on render |
| A04 Insecure Design                    | Audited  | Threat-modelled the iframe flow; CSP scoped per-route                 |
| A05 Security Misconfiguration          | OK       | `secureHeaders` middleware; strict CSP; no `'self'` wildcards         |
| A06 Vulnerable Components              | Monitored | `npm audit` in CI; Dependabot weekly                                  |
| A07 Auth Failures                      | OK       | Google OAuth + signed sessions + timing-safe equality                 |
| A08 Software/Data Integrity            | OK       | Stripe webhook signature verification; idempotency on event id        |
| A09 Logging / Monitoring               | OK       | Sentry breadcrumbs on every state change; CSP report-uri              |
| A10 SSRF                               | Limited  | Only outbound calls are to allow-listed providers (Anthropic, Listmonk, Stripe). No user-supplied URLs are fetched server-side. |

A06 is the highest residual risk — supply chain. `npm audit --omit=dev` runs in CI; major-version bumps go through manual review.

## Sentry security events

Failed auth, CSP violations, and Listmonk anomalies all surface in Sentry:

- **CSP report-uri** — `https://sentry.megabyte.space/api/security/?sentry_key=megabyte-pdf` collects browser-reported violations.
- **Auth callback errors** — captured with `Sentry.captureException({ tags: { route: "auth.callback" } })`.
- **Listmonk failures** — `Sentry.captureMessage("newsletter.subscribe.listmonk_fail", { level: "error" })` so a Listmonk outage shows up in error frequency, not silent drop.

Set up alerts in Sentry for: auth error rate > 1/min, CSP violations > 10/hr for a single directive (signals a new third party that needs allow-listing), Listmonk 5xx > 5/min.

## Bot protection

Turnstile is provisioned but not yet wired into the inline newsletter signup — the per-IP rate limit is cheap enough to absorb low-volume abuse. Add a visible challenge if:

- Signup-to-confirm ratio drops below 30% (bot signups don't open emails).
- KV rate-limit keys grow faster than expected unique-visitor counts.

Stripe checkout and Google OAuth both bring their own bot defences; we don't layer Turnstile on top.

## Reviewing security changes

When you touch any of the surfaces below, walk the change through this checklist:

- **CSP** — does any new third party need an allow-listed origin? Document the addition in `src/worker/index.ts` with a comment naming the service.
- **Auth** — does the change touch `sessions`, `users`, or `findUserBySession()`? Run `tests/editor.spec.ts` which exercises the full sign-in → render → export path.
- **Public endpoint** — does it validate input with Zod? Is it rate-limited? Does it log to Sentry on failure?
- **Webhook** — does it verify the signature with the right secret? Is it idempotent?
- **Secret** — is it in `wrangler secret`, not `[vars]`? Is it referenced via `c.env`, not `process.env`?

When in doubt, run the `security-reviewer` agent on the diff before merging.
