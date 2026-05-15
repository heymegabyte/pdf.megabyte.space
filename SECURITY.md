# Security Policy

## Reporting a vulnerability

Please **do not open a public GitHub issue** for security-impacting bugs.

Email `hey@megabyte.space` with:

- A clear description of the issue and its impact.
- A minimal reproduction (URL, steps, payload, screenshots).
- Any mitigations you've already tried.

You'll get an initial response within **48 hours**. Confirmed issues that
require user action will be disclosed publicly after the fix is deployed and
verified in production.

## Scope

In-scope:

- `pdf.megabyte.space` and any subdomain we operate.
- The Cloudflare Worker, D1 database, KV namespaces, R2 buckets backing it.
- The Listmonk transactional pipeline + cron-driven email cohorts.

Out-of-scope:

- Third-party services we depend on (Cloudflare, Stripe, Listmonk, Sentry,
  Google OAuth) — please report to their security teams.
- Vulnerabilities only exploitable with a compromised browser, OS, or
  end-user device.
- Findings from automated scanners with no demonstrated impact (e.g.
  "missing `X-Powered-By` header"). Show the actual exploit.

## Hardening already in place

- Strict global CSP (`src/worker/lib/security-headers.ts`) — no `unsafe-eval`,
  every external origin is explicit, no wildcard `script-src`.
- Per-path scoped CSP for `/api/public/:slug/render` + `/s/:slug/render`,
  which host arbitrary user HTML.
- HSTS preload, `frame-ancestors 'self'`, `Referrer-Policy: strict-origin`.
- HMAC-SHA-256 signed session cookies, `HttpOnly` + `Secure` + `SameSite=Lax`.
- Google OAuth 2.0 with PKCE (no implicit flow).
- KV-based per-IP rate limiting on public endpoints.
- Zod validation on every request body (`@hono/zod-validator`).
- All errors flow through `app.onError` and are captured in Sentry with
  `route` + `method` + redacted user-id tags.

## Disclosure timeline

| Day | Action |
|----:|--------|
| 0   | Report received, acknowledged within 48 hours. |
| 1-7 | Reproduce, classify severity, draft fix. |
| 7-30| Deploy fix, verify in production, prepare advisory. |
| 30+ | Coordinated public disclosure with credit to the reporter (with consent). |

We do not currently run a paid bug-bounty program but will publicly credit
researchers in `CHANGELOG.md` for valid findings.
