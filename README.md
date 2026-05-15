# Megabyte PDF

> Prompt-to-PDF in one tab. Type what you want, watch the document render live, ship as PDF in seconds.

Live: <https://pdf.megabyte.space>

## What it is

A single-tab document studio that turns natural-language prompts into branded, paginated PDFs. The editor pairs a live WYSIWYG canvas with an AI chat drawer (Claude Sonnet) and a CodeMirror HTML/CSS panel for power users. Exports are rendered server-side in headless Chrome (Cloudflare Browser binding), persisted to R2, and shared through public slugs (`/c/<slug>`) with iframe-friendly preview routes.

The whole product runs on a single Cloudflare Worker. No origin servers, no separate API service — the Worker terminates HTML, JSON API, RSS, sitemaps, and the iframe render endpoint.

## Stack

| Layer        | Tech                                                                |
| ------------ | ------------------------------------------------------------------- |
| Frontend     | React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4 + react-router 7    |
| Editor       | CodeMirror 6 (HTML/CSS) + custom WYSIWYG canvas                     |
| API          | Cloudflare Workers + Hono 4                                         |
| DB           | Cloudflare D1 (SQLite) via Drizzle ORM 0.45                         |
| Cache / KV   | Cloudflare KV (`CACHE`)                                             |
| Object store | Cloudflare R2 (`PDFS`)                                              |
| AI           | Anthropic Claude (`@anthropic-ai/sdk`) + Workers AI (`AI` binding)  |
| PDF render   | `@cloudflare/puppeteer` over the Browser Rendering binding          |
| Auth         | Google OAuth (server-side) + signed session cookies                 |
| Billing      | Stripe (optional — Pro and Unlimited price IDs)                     |
| Email        | Listmonk transactional API + KV-cached template alias map           |
| Telemetry    | Sentry (Worker + browser) + PostHog                                 |
| Tests        | Vitest (unit) + Playwright 1.59 + axe-core                          |

## Repo map

```
src/
  web/                       React SPA
    pages/                   Route-level components (Landing, Editor, Dashboard, ...)
    components/              Shared UI (TopBar, Footer, PodcastTeaser, NewsletterSignup, ...)
    lib/                     Client utilities (analytics, fetcher, auth)
    main.tsx                 App root + router
    styles.css               Tailwind entry + globals
  worker/
    index.ts                 Hono root: middleware, CSP, route mounts, sitemap/feed
    types.ts                 Env + Variables interfaces
    db/schema.ts             Drizzle schema (users, projects, turns, share-links, ...)
    routes/                  Mounted Hono sub-apps (auth, projects, chat, share, podcast, newsletter, ...)
    lib/                     Server utilities (listmonk, ai-*, auth, emails, drive, system-prompt)
drizzle/                     SQL migrations
emails/                      HTML transactional templates (Listmonk-synced)
scripts/                     Ops scripts (deploy.sh, listmonk-sync.mjs, smoke.mjs, seed)
tests/                       Playwright e2e
public/                      Static assets shipped via the `ASSETS` binding
dist/                        Build output (vite build)
```

## Setup

Requirements: Node ≥ 20, `wrangler` 4.x, a Cloudflare account, and (optional) Listmonk/Stripe/Anthropic credentials.

```bash
git clone <repo>
cd megabyte-pdf
npm install
# Drop secrets into .dev.vars at the repo root — see "Environment" below.
npm run db:apply:local           # apply migrations to local D1
npm run dev                      # concurrently runs web (vite) + api (wrangler)
```

Open <http://localhost:5173>. Vite proxies `/api/*` and `/s/*` to the local Wrangler dev server on `:8787`.

## Scripts

| Command                  | What it does                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `npm run dev`            | Web + Worker dev servers in parallel (concurrently)                                |
| `npm run dev:web`        | Vite only — fastest HMR if you don't need the Worker                               |
| `npm run dev:api`        | `wrangler dev` only                                                                |
| `npm run build`          | `vite build` → `dist/` (consumed by Worker `ASSETS` binding at deploy time)        |
| `npm run typecheck`      | `tsc --noEmit` — no emit, just type errors                                         |
| `npm run lint`           | ESLint over `.ts` / `.tsx`                                                         |
| `npm run format`         | Prettier write-all                                                                 |
| `npm run deploy`         | `npm run build && wrangler deploy`                                                 |
| `npm run db:generate`    | Drizzle-kit migration generator                                                    |
| `npm run db:apply:local` | Apply migrations to local D1                                                       |
| `npm run db:apply:prod`  | Apply migrations to remote D1 (uses `--remote`)                                    |
| `npm run db:seed:local`  | Seed community-PDF fixtures into local D1                                          |
| `npm run db:seed:prod`   | Seed community-PDF fixtures into remote D1                                         |
| `npm test`               | `vitest run`                                                                       |
| `npm run test:watch`     | `vitest` watch mode                                                                |
| `npm run test:e2e`       | Playwright e2e (`tests/`)                                                          |

## Environment

Public, non-secret config lives in `wrangler.toml` under `[vars]`. Secrets live in:

- **local dev** — `.dev.vars` at the repo root (gitignored).
- **prod** — `wrangler secret put <NAME>` against the `megabyte-pdf` Worker.

| Variable                              | Required           | Notes                                                                |
| ------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                   | yes                | Claude calls in chat + assistant routes                              |
| `GOOGLE_CLIENT_ID` / `_SECRET`        | yes                | OAuth sign-in                                                         |
| `SESSION_SECRET`                      | yes                | HMAC for signed session cookies                                       |
| `SENTRY_DSN` / `SENTRY_DSN_CLIENT`    | recommended        | Server + browser error capture                                        |
| `POSTHOG_API_KEY` / `POSTHOG_HOST`    | recommended        | Product analytics                                                     |
| `GTM_CONTAINER_ID` / `GA4_MEASUREMENT_ID` | optional       | Google Tag Manager + GA4                                              |
| `STRIPE_SECRET_KEY` / `_WEBHOOK_SECRET` / `_PRICE_ID_PRO` / `_PRICE_ID_UNLIMITED` | optional | Billing — endpoints degrade gracefully when unset                     |
| `LISTMONK_BASE_URL` / `_API_USER` / `_API_TOKEN` | recommended | Transactional email + list management                                 |
| `LISTMONK_FROM_EMAIL` / `_FROM_NAME`  | optional           | Defaults from `[vars]`                                                |
| `LISTMONK_LIST_ID`                    | optional           | Default broadcast list — falls back when cohort-specific id is unset   |
| `LISTMONK_PODCAST_LIST_ID`            | optional           | Podcast waitlist cohort                                                |
| `LISTMONK_NEWSLETTER_LIST_ID`         | optional           | Product-newsletter cohort                                              |
| `EMAIL_UNSUB_SECRET`                  | recommended        | HMAC for one-click unsubscribe tokens                                  |
| `ADMIN_EMAIL`                         | optional           | Gates `/api/admin/plan` (test-only plan toggle)                        |
| `CRON_SECRET`                         | optional           | Shared secret to manually trigger scheduled handlers                   |

When Listmonk creds are absent the public endpoints (`/api/newsletter/subscribe`, `/api/podcast/subscribe`) still accept signups — they log a Sentry warning so no one is lost — but no list write or welcome mail happens.

## Deployment

```bash
npm run deploy
```

This runs `vite build` then `wrangler deploy`. The Worker is bound to the custom domain `pdf.megabyte.space` (see `wrangler.toml`). After a deploy, purge the Cloudflare cache if you changed assets:

```bash
wrangler kv key delete --binding=CACHE "listmonk:tpl:v1"   # bust template-id cache if templates changed
```

See [`docs/deployment.md`](docs/deployment.md) for rollback, secret management, and a full post-deploy checklist.

## Routing model

Cloudflare Assets serves `dist/` as a single-page app (`not_found_handling = "single-page-application"`). The Worker is invoked **before** the Assets handler for path prefixes listed under `run_worker_first` in `wrangler.toml`:

```
/api/*, /s/*, /og/*, /podcast/*, /sitemap.xml, /feed.xml, /feed.json
```

Anything outside that list falls through to the SPA, which is what we want for client-side routes like `/dashboard`, `/editor/:id`, `/c/:slug`, etc.

Two pitfalls this guards against:

1. **RSS / JSON feeds**: without `run_worker_first`, Assets serves the SPA HTML before the Worker can answer `/podcast/feed.xml`.
2. **OG cards**: dynamic `/og/<slug>.png` is generated by the Worker; if Assets caught it first you'd get a 404 or the SPA shell.

## Email + Listmonk

Listmonk is the system of record for both broadcast and transactional mail. `src/worker/lib/listmonk.ts` exposes:

- `listmonkConfigured(env)` — boolean guard used by every public endpoint.
- `listmonkUpsertSubscriber(env, args)` — idempotent create-or-update with 409 PATCH fallback.
- `listmonkSendTx(env, args)` — transactional send. Resolves a template **alias → numeric id** via a KV-cached map (`listmonk:tpl:v1`, 1-day TTL) because the `/api/tx` endpoint requires an int.
- `listmonkBlocklistByEmail(env, email)` — drives the one-click unsubscribe.

Templates live in `emails/*.html` and are pushed to Listmonk by `scripts/listmonk-sync.mjs`. The sync script reads each file, derives the alias from the filename, and upserts it via the Listmonk template API. Run it whenever a template changes — the KV map auto-invalidates after the next cache miss.

Crons (defined in `wrangler.toml`) drive the broadcast cadence: abandoned prompts (daily), weekly digest (Sat), template-of-the-week (Mon), win-back + AI-boost (daily 14:30), tip-of-the-week (Wed), privacy report (quarterly).

## Health + diagnostics

- `GET /api/health` — `{ status, version, timestamp }`. Used by external uptime checks.
- `GET /api/config` — runtime public config (PostHog, Stripe public keys, app version).
- `GET /podcast/feed.xml` — iTunes-namespaced RSS 2.0 feed (validates pre-launch with zero items).

## Troubleshooting

| Symptom                                        | First thing to check                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/podcast/feed.xml` returns HTML, not XML      | `/podcast/*` missing from `run_worker_first` in `wrangler.toml`                       |
| Newsletter signup returns 200 but no email     | `LISTMONK_*` secrets unset OR `newsletter_welcome` template missing in Listmonk        |
| Iframe preview at `/c/<slug>` is a broken icon | Parent SPA CSP missing `frame-src 'self'` — see memory `project_csp_frame_src_self.md` |
| `wrangler deploy` 403 from CF API              | Use `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` (not `CLOUDFLARE_API_TOKEN`)             |
| Drizzle errors after schema edit               | Re-run `npm run db:generate` then `npm run db:apply:local`                             |
| TypeScript `noUncheckedIndexedAccess` errors   | Index access on arrays / records returns `T | undefined` — guard or use `??`           |

## Docs

- [`docs/architecture.md`](docs/architecture.md) — system design and data model
- [`docs/development.md`](docs/development.md) — dev workflows, hot reload, gotchas
- [`docs/deployment.md`](docs/deployment.md) — deploy flow, rollback, post-deploy checklist
- [`docs/security.md`](docs/security.md) — CSP, auth, rate limiting, secret hierarchy
- [`docs/testing.md`](docs/testing.md) — unit + e2e + a11y test strategy
- [`docs/decisions.md`](docs/decisions.md) — ADR-style log of key architectural choices
- [`CLAUDE.md`](CLAUDE.md) — repo-specific guidance for AI agents

## License

Proprietary — Megabyte Labs. Contact <hey@megabyte.space>.
