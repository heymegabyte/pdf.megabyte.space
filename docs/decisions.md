# Architectural Decisions

ADR-style log of the architectural choices that shape this codebase. Each entry: context, decision, consequence, and what would force a revisit.

The point of this doc is to spare future contributors (human or AI) from re-litigating settled questions. If you're about to argue against one of these, read the consequence column first — there's usually a reason that isn't obvious from the code.

---

## ADR-001 — Single Cloudflare Worker, no separate API service

**Date:** 2026-03-12
**Status:** Accepted

### Context

Megabyte PDF needs: a SPA, a JSON API, server-rendered RSS, OG card generation, iframe-friendly PDF render endpoints, scheduled email sends, and headless-Chrome PDF export. Conventional architecture would split these across a CDN (assets), an origin API (Node/Express), a separate cron worker, and a browser-rendering service.

### Decision

Run the entire backend as one Cloudflare Worker (`megabyte-pdf`), with the SPA shipped as static assets via the Cloudflare Assets binding. Routes are owned by Hono sub-apps mounted in `src/worker/index.ts`. Scheduled jobs run via `[triggers].crons` in `wrangler.toml`. PDF export uses the `BROWSER` binding.

### Consequence

- **Single deploy artefact.** `wrangler deploy` ships the whole product. No multi-service orchestration.
- **One CSP, one auth surface.** Easier to reason about.
- **50ms / 30s CPU budget.** Long-running work must use `c.executionCtx.waitUntil(...)` or move to a queue.
- **No traditional process state.** Anything you'd put in module-level memory has to go in KV / D1 / R2.
- **Cloudflare lock-in.** The Worker uses `BROWSER`, `AI`, D1, R2, KV bindings — none portable.

### Revisit when

- We need >30s CPU per request and `waitUntil` no longer covers it.
- Pricing economics flip such that a dedicated origin is cheaper than the Worker's request-billed model.

---

## ADR-002 — Hono 4 over a custom router

**Date:** 2026-03-12
**Status:** Accepted

### Context

Workers don't ship with a default router. Options: roll our own with `URLPattern`, use itty-router (zero deps), Hono, or `@cloudflare/workers-types` + manual switch statements.

### Decision

Hono 4. Inline handlers for type inference. `@hono/zod-validator` on every request body. Sub-apps per file in `src/worker/routes/`, mounted in `src/worker/index.ts`.

### Consequence

- **End-to-end type safety** with `hc<AppType>` (we don't use the RPC client yet, but the option is there).
- **Centralised middleware** — logger, CORS, secure-headers, auth all compose cleanly.
- **Zod-validated input** at the boundary, parsed types in the handler. Eliminated a class of "user sent a string when we expected a number" bugs.
- **Sub-app pattern** keeps `index.ts` small. Each domain (auth, projects, podcast, newsletter, ...) gets its own file.

### Revisit when

- Hono adds a breaking change in major v5/v6 that costs more to migrate than to swap routers.
- Bundle size from Hono becomes load-bearing (today: ~30KB gzipped, irrelevant).

---

## ADR-003 — Drizzle ORM 0.45 over raw D1 SQL

**Date:** 2026-03-14
**Status:** Accepted

### Context

D1 is SQLite. Raw SQL via `db.prepare()` works but every query needs hand-written types. Options considered: raw SQL with manual types, kysely (type-safe query builder), Drizzle (schema-first ORM with migration tooling).

### Decision

Drizzle 0.45 with `drizzle-kit` for migrations. Schema lives in `src/worker/db/schema.ts`. Migrations generated to `drizzle/*.sql`.

### Consequence

- **Schema is code.** Type-safe everywhere; renaming a column is a refactor, not a search-and-replace.
- **Migration generation.** `npm run db:generate` reads the schema diff and writes the SQL.
- **D1 has no transactions.** Use `db.batch([stmt1, stmt2])` for multi-statement writes. Drizzle exposes this directly.
- **Drizzle is moving fast.** v1 with relational-queries v2 is shipping; we'll need a migration plan.
- **Soft-delete by convention.** Every table that ought to support undo gets a `deletedAt` column and we filter on `isNull(deletedAt)`. Saved us from a "user deleted their project then asked for it back" incident.

### Revisit when

- Drizzle v1 ships and forces a non-trivial migration (planned within 2026).
- We outgrow D1's 1TB / 100GB-per-DB limits — at that point we move to Neon / Turso and the ORM choice might shift.

---

## ADR-004 — Listmonk over Resend / Postmark for email

**Date:** 2026-03-20
**Status:** Accepted

### Context

We need transactional email (welcome, share notifications, billing receipts, unsubscribe) AND broadcast email (weekly digest, template-of-the-week, abandoned-prompt recovery). Most SaaS uses two services: Resend for transactional, Customer.io or ConvertKit for broadcast. Cost adds up, and the systems don't share a subscriber list.

### Decision

Self-hosted Listmonk at `https://listmonk.megabyte.space` handles both. `src/worker/lib/listmonk.ts` wraps the API. Templates live in `emails/*.html` and sync via `scripts/listmonk-sync.mjs`.

### Consequence

- **One subscriber list, many cohorts.** Newsletter, podcast waitlist, paying customers all live in one Listmonk instance, segmented by attribs.
- **Template alias → numeric id** caching in KV (`listmonk:tpl:v1`, 1-day TTL) — Listmonk's `/api/tx` endpoint requires an int, the rest of our code uses string aliases.
- **API user auth.** Listmonk 3.x uses `Authorization: token <user>:<key>`. Old "Basic auth" docs are wrong for 3.x.
- **Self-hosted, so we own the deliverability.** Coolify runs the container; we pay for the VPS + Mailgun relay, not per-email Resend pricing.
- **Listmonk goes down → no emails.** We mitigate with "Listmonk disabled" mode: endpoints accept signups, log a Sentry warning, return `{ ok: true, queued: true }`. No one is lost.
- **Crons drive broadcasts.** Six scheduled triggers in `wrangler.toml` fan out to the right Listmonk lists.

### Revisit when

- Listmonk's API stops keeping pace with what we need (custom suppression rules, multi-tenant cohorts).
- Self-hosting overhead exceeds the per-email cost difference vs Resend (today: hours/year vs ~$200/month at our volume).

---

## ADR-005 — `run_worker_first` for server-rendered prefixes

**Date:** 2026-03-25
**Status:** Accepted

### Context

Cloudflare Assets serves `dist/` as a single-page app. By default, Assets handles the request first and falls back to the Worker only on 404. That works fine for `/dashboard` (SPA route, Assets returns 200 with `index.html`) but breaks for `/podcast/feed.xml` — Assets has no such file, returns 404 → Worker fires, returns RSS. The default behaviour also returned SPA HTML for some prefixes due to a `not_found_handling` interaction.

The breakage manifested as: feed readers got HTML, broke. OG card scrapers got SPA shell, no card. Sitemap returned 404 for some routes.

### Decision

Use `run_worker_first` in `wrangler.toml` to invoke the Worker **before** Assets for explicit prefixes:

```toml
[assets]
run_worker_first = ["/api/*", "/s/*", "/og/*", "/podcast/*", "/sitemap.xml", "/feed.xml", "/feed.json"]
```

Everything outside this list falls through to Assets, which is the correct behaviour for client-side routes.

### Consequence

- **RSS / JSON feeds always work.** `/podcast/feed.xml` returns `application/rss+xml`, not SPA HTML.
- **OG cards always generate.** Dynamic `/og/<slug>.png` hits the Worker, not Assets.
- **Adding a new server-rendered prefix requires updating this list.** This is the #1 source of "I deployed but the new endpoint returns HTML" confusion. Documented in `docs/architecture.md` with a checklist.
- **Vite proxy must mirror it for local dev** — `/api`, `/s`, etc. need to be proxied to the Wrangler dev server in `vite.config.ts`.

### Revisit when

- Cloudflare ships a different routing primitive (function-style prefixes, per-route bindings).

---

## ADR-006 — Per-route CSP override for PDF render endpoints

**Date:** 2026-04-02
**Status:** Accepted

### Context

The render endpoints (`/api/public/:slug/render`, `/s/:slug/render`) serve user-authored HTML+CSS+images inside an iframe. The global CSP forbids inline styles, third-party images, etc — which breaks user PDFs.

Tightening the iframe was non-negotiable: we can't allow user-authored JavaScript to execute and exfiltrate cookies / call APIs.

### Decision

`isUserRenderPath()` in `src/worker/index.ts` matches the two render paths. The global `strictSecureHeaders` middleware skips them. Each handler sets its own scoped CSP:

```
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

Key invariants: `script-src 'none'`, `connect-src 'none'`, `frame-ancestors 'self'`.

### Consequence

- **User PDFs render correctly** with photos, fonts, inline styles.
- **No JavaScript execution.** Editor output is a document, not an app. Even if a user pastes `<script>...</script>`, it never runs.
- **No data exfiltration.** With `connect-src 'none'`, smuggled scripts (if they ever bypassed `script-src 'none'`) couldn't beacon out.
- **Parent SPA still needs `frame-src 'self'`** in the global CSP to embed these iframes. Memory pin: `project_csp_frame_src_self.md`.

### Revisit when

- We add a feature that requires JS in user PDFs (interactive forms, live data). That would be a substantial new threat model and demands its own ADR.

---

## ADR-007 — Google OAuth as the only auth method

**Date:** 2026-03-30
**Status:** Accepted

### Context

The product targets working professionals who already have Google Workspace accounts. Adding email/password adds a forgot-password flow, breach-monitoring, MFA, and a ton of UX surface area.

### Decision

Google OAuth 2.0 with PKCE is the only sign-in path. Sessions stored in D1, identified by a 32-byte random id, signed with HMAC-SHA-256 in the cookie. 30-day TTL.

### Consequence

- **No password storage, no password reset, no breach exposure.**
- **Email is verified by Google** — saves us a confirmation flow.
- **Anyone without a Google account is locked out.** This is the major downside. Guest mode (`/guest`) covers anonymous one-shot use.
- **OAuth redirect URI is a deploy-time config.** Local dev + prod both need to be allow-listed in the Google Cloud console.
- **`COOP: same-origin` cannot be enabled** — the OAuth popup needs cross-origin window communication. Documented in `docs/security.md`.

### Revisit when

- We expand to markets where Google account adoption is low.
- A SOC 2 / enterprise customer demands SSO via SAML / Okta.

---

## ADR-008 — Crons for monitoring, not orchestration

**Date:** 2026-04-05
**Status:** Accepted

### Context

`wrangler.toml [triggers].crons` runs scheduled handlers in the Worker. Tempting use: orchestrate workflows ("at 14:00 UTC, build all the things"). Reality: crons are eventually-consistent, can fail silently, and have the same 50ms / 30s CPU budget as any other Worker invocation.

### Decision

Crons drive **monitoring + fan-out only**. Each tick reads from D1, queues per-record sends to Listmonk, returns. Crons never construct new state, never make irreversible decisions, never act as the system of record.

### Consequence

- **Email cadence is reliable.** Six triggers (`docs/architecture.md` lists them) each handle one cohort. A failed cron run is recoverable from the next tick.
- **D1 + Listmonk are the systems of record.** Crons re-read state every tick, so a missed run doesn't lose data.
- **`emailEvents.dedupKey` is unique-indexed.** Crons that re-fire don't double-send.
- **Anything that needs more than 30s** moves to Cloudflare Queues or a separate background worker.

### Revisit when

- We need cross-cron coordination (e.g. workflow with retries and branching). Then it's Queues or Workflows time.

---

## ADR-009 — Strict secure-headers + `'unsafe-inline'` style-src

**Date:** 2026-04-10
**Status:** Accepted, with caveats

### Context

Modern CSP best practice: nonce-based `script-src`, no `'unsafe-inline'`. Reality: Tailwind 4 injects runtime CSS-in-JS via inline `<style>`. GTM, Stripe.js, and the `window.__APP_CONFIG__` bootstrap blob all use inline scripts. Nonce-based CSP requires SSR or a runtime-mutated header per request — both at odds with the static Asset binding.

### Decision

Accept `'unsafe-inline'` on `style-src` and `script-src` for now. Lock down everything else: explicit allow-list for `connect-src` (Sentry, PostHog, Stripe, Google OAuth, GTM), explicit `frame-src` allow-list (Stripe checkout, Turnstile, Google sign-in), `object-src 'none'`, `base-uri 'self'`, `report-uri` pointing at Sentry.

### Consequence

- **CSP is strict where it can be.** Three high-risk directives (`connect-src`, `frame-src`, `object-src`) are tight.
- **CSP violation reporting is wired.** Sentry collects browser-reported violations at `https://sentry.megabyte.space/api/security/?sentry_key=megabyte-pdf`.
- **XSS protection on the editor relies on framework escaping + the per-route render CSP**, not on the global CSP.
- **`'unsafe-inline'` blocks a clean SOC 2 / OWASP report.** Acceptable today, on the roadmap to fix.

### Revisit when

- Tailwind 4 ships a build-time-only mode (no runtime inline styles).
- We drop GTM in favour of edge-side analytics (server-rendered tag injection).

---

## ADR-010 — KV-backed rate limiting

**Date:** 2026-04-12
**Status:** Accepted

### Context

We need rate limits on public endpoints (newsletter signup, podcast waitlist, share-link creation, chat). Options: Cloudflare's built-in Rate Limiting product (extra Workers Paid feature), Durable Objects (strong consistency, more cost), KV (eventually consistent, cheap).

### Decision

KV. Keys: `ratelimit:<feature>:<ip>:<YYYY-MM-DD>`. TTL: 26 hours (a day + slack). Pattern documented in `docs/security.md` and `CLAUDE.md`.

### Consequence

- **Cheap.** Reads are free on the Workers Paid plan up to generous limits.
- **Eventually consistent globally.** A determined attacker hitting multiple Cloudflare PoPs can spike beyond the cap. Worst-case (10 → ~50 signups before convergence) is inside the noise budget.
- **Per-day granularity.** Fine for human-rate abuse (newsletter signup) — coarse for high-frequency endpoints (chat). Chat falls back to per-plan quotas.
- **No reset endpoint.** TTL expires the key. If we ever need "forgive this IP", we'd have to write a Durable Object.

### Revisit when

- Abuse patterns demand per-minute / per-second granularity.
- A specific attack lands that exploited KV's eventual consistency.

---

## ADR-011 — JSON-first API, no GraphQL

**Date:** 2026-03-12
**Status:** Accepted

### Context

The SPA needs ~15 endpoints. GraphQL is sometimes pitched for this. Hono + JSON would let us ship in a fraction of the surface area.

### Decision

Plain JSON over HTTP. Routes named by domain (`/api/projects/:id`, `/api/share/:slug`). No GraphQL schema, no Apollo, no codegen.

### Consequence

- **Simpler.** Adding an endpoint is 20 lines of Hono + Zod. No schema rewrite.
- **No N+1 problems** because there's no client-driven query graph.
- **Each endpoint is purpose-built.** When the SPA needs a different shape, we add a new route, not a new resolver.
- **No federation story.** Doesn't matter — we don't federate.

### Revisit when

- We add a public API that third parties consume directly and a typed query language adds enough value.

---

## ADR-012 — TypeScript with `noUncheckedIndexedAccess`

**Date:** 2026-03-12
**Status:** Accepted

### Context

`tsconfig.json` has `noUncheckedIndexedAccess: true`. Every `array[i]` and `record[k]` returns `T | undefined`. Forces explicit handling.

### Decision

Keep it on. Use `?? defaultValue` or explicit guards. Convert D1 `null` to `undefined` at the boundary (`row.title ?? undefined`).

### Consequence

- **No "cannot read property X of undefined" surprises** in production.
- **Slightly more verbose code at access sites.** Worth it.
- **D1 columns marshal as `null`** but React props prefer `undefined`. Adapters convert at the boundary.

### Revisit when

- Never. This is settled.

---

## ADR template

When adding a new ADR, copy this:

```markdown
## ADR-NNN — <short title>

**Date:** YYYY-MM-DD
**Status:** Proposed / Accepted / Superseded by ADR-MMM

### Context
What problem are we solving? What constraints apply?

### Decision
What we're doing.

### Consequence
Good and bad. Be honest about tradeoffs.

### Revisit when
The conditions that would force us to re-open this question.
```

Number sequentially. Once accepted, an ADR is not edited — superseding ADRs reference and replace it.
