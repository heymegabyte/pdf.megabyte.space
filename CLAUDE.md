# CLAUDE.md — Megabyte PDF

Repo-specific guidance for AI agents working in this codebase. Keep changes small, behaviour-preserving, and verifiable with the gates listed at the bottom.

## What this project is

Single-Worker SaaS at <https://pdf.megabyte.space>. Prompt → live HTML/CSS canvas → headless-Chrome PDF → public shareable slug. One Cloudflare Worker terminates everything: SPA assets, JSON API, RSS feeds, sitemap, OG images, iframe PDF previews, and scheduled email crons.

## Stack at a glance

- **Frontend** — React 19 + Vite 7 + Tailwind 4 + react-router 7. Entry: `src/web/main.tsx`.
- **Worker** — Hono 4. Entry: `src/worker/index.ts`. Sub-apps under `src/worker/routes/*.ts`.
- **DB** — D1 + Drizzle ORM 0.45. Schema: `src/worker/db/schema.ts`. Migrations: `drizzle/`.
- **Storage** — R2 bucket `PDFS`, KV namespace `CACHE`.
- **AI** — Anthropic SDK (Claude Sonnet) + Workers AI (`AI` binding).
- **Email** — Listmonk transactional API; templates in `emails/*.html`, synced via `scripts/listmonk-sync.mjs`.
- **Tests** — Vitest (`*.test.ts` colocated) + Playwright (`tests/`).

## Conventions

- **TypeScript strict + `noUncheckedIndexedAccess`** — array / record access is `T | undefined`. Guard or coalesce; do not cast.
- **Hono inline handlers** — keep type inference. Don't extract handlers into separate controller files.
- **Zod for every request body** — `@hono/zod-validator` on every `POST`/`PATCH`.
- **`onError` + Sentry** — every uncaught error is captured with `route` + `method` tags. Add breadcrumbs (`Sentry.addBreadcrumb`) for important steps; capture exceptions explicitly when you swallow an error.
- **Fire-and-forget side effects** use `c.executionCtx.waitUntil(...)` — they must never block the response.
- **No `null` in new code** — use `undefined`. Existing `null`s in DB columns are fine.
- **JSDoc only on exports** with non-obvious intent. Don't paraphrase the implementation.

## Routing model (CRITICAL — read before adding any new route)

`wrangler.toml` ships `dist/` via the Cloudflare Assets binding with SPA fallback. The Worker only sees requests for path prefixes listed in `run_worker_first`:

```
/api/*, /s/*, /og/*, /podcast/*, /sitemap.xml, /feed.xml, /feed.json
```

If you add a non-`/api/*` worker route that needs server rendering (RSS, JSON feed, OG image, redirect, iframe-only HTML), **add its prefix to `run_worker_first` or it will be intercepted by Assets and serve the SPA shell**. This is the canonical incident: `/podcast/feed.xml` first deploy returned `text/html` because `/podcast/*` was missing from the list.

Conversely, never list a SPA route (e.g. `/dashboard`) in `run_worker_first` — that would force every visit through the Worker for no reason.

Hono mounts in `src/worker/index.ts`:

```
/api/auth      → auth
/api/projects  → projects
/api/...       → chat, exportRoutes, shareApi, explore, billing, guest, follows, email, assistant
/api/podcast   → podcast (subscribe)
/api/newsletter → newsletter (subscribe)
/s             → sharePublic
/og            → ogRoutes
/podcast       → podcastPublic (RSS feed.xml)
```

## CSP

A strict global CSP is applied via `hono/secure-headers` in `src/worker/index.ts`. Two paths bypass it:

- `/api/public/:slug/render` and `/s/:slug/render` — these host arbitrary user HTML/CSS/images and set their own scoped CSP in-handler.

The parent SPA CSP must include `frame-src 'self'` so the editor + public `/c/<slug>` page can iframe these render endpoints. If iframe previews ever break, check that first.

When you add an external script/origin (analytics, payments, a new third party), update the relevant directive (`scriptSrc`/`connectSrc`/`imgSrc`/`frameSrc`/`fontSrc`/`styleSrc`) in `strictSecureHeaders`. Don't relax the policy globally.

## Listmonk integration

`src/worker/lib/listmonk.ts` is the canonical client. Three exports matter:

- `listmonkConfigured(env)` — every public endpoint guards on this. When false, accept the user action, log a Sentry warning with the payload, return `{ok:true, queued:true}`. Never lose a signup because of misconfigured secrets.
- `listmonkUpsertSubscriber(env, args)` — POST with 409 → PATCH fallback. Use this for any cohort write.
- `listmonkSendTx(env, args)` — Resolves a template **alias → numeric id** through a KV-cached map (`listmonk:tpl:v1`, 1-day TTL). If a template alias is added or renamed in Listmonk, delete that KV key to force a re-read.

Auth header is `Authorization: token <user>:<key>` (Listmonk 3.x API-user pattern), not Basic.

When you add a transactional flow:

1. Add the template HTML to `emails/<NN>-<name>.html` matching the existing layout/base partials.
2. Run `scripts/listmonk-sync.mjs` to push it.
3. Call `listmonkSendTx(env, { templateAlias: '<name>', ... })` from your handler, inside `c.executionCtx.waitUntil(...)`.
4. Never block the response on email delivery.

## Crons

Schedule lives in `wrangler.toml` under `[triggers].crons`. Handler is `runCron(env, controller)` in `src/worker/cron.ts`. Each cron entry maps to a specific email cohort (abandoned-prompt, weekly-digest, etc.). Crons are **monitoring only** — they read D1, dispatch via Listmonk, never accept user input. If you add a cron, document its purpose with a comment in `wrangler.toml` next to the cron line.

## Database

- Single source of truth: `src/worker/db/schema.ts`.
- Migrations are SQL files in `drizzle/`. Generate with `npm run db:generate`, apply with `npm run db:apply:local` / `:prod`.
- `db.batch([...])` for multi-statement work — D1 has no transactions.
- Soft-delete via `deletedAt` on `projects`. Always `isNull(deletedAt)` in user-facing queries.
- Composite indexes on hot paths (`(userId, deletedAt, updatedAt)` on projects, `(projectId, createdAt)` on turns). Match the existing index style.

## Code quality

- **Functions ≤ 50 lines**, cyclomatic ≤ 10, params ≤ 3. Split when a handler grows.
- **No dead code, no commented-out blocks.** Delete instead.
- **Imports at top** sorted by depth (`hono` → `@hono/*` → `@sentry/*` → relative).
- **Error envelope** — `{ error: string, code?: string, details?: unknown }`. Centralized in `app.onError()`.
- **Rate limiting** — KV-based per-IP counter pattern. See `src/worker/routes/newsletter.ts` and `podcast.ts` for the reference idiom (`ratelimit:<feature>:<ip>:<YYYY-MM-DD>` key, 10/day, 26-hr TTL).

## When you finish a change

Run, in order:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest run
npm run build        # vite build — catches missing assets, bundle errors
```

Then if anything user-visible changed:

- `npm run test:e2e` against `pdf.megabyte.space` (or local) for the smoke flow.
- Eyeball the rendered Landing route at `http://localhost:5173` and on prod after deploy.

Deploy with `npm run deploy`. Verify `/api/health` returns `ok` and the new feature works in production before declaring done.

## Common pitfalls (read before debugging)

1. **`text/html` on a feed endpoint** → missing `run_worker_first` prefix in `wrangler.toml`.
2. **Iframe preview shows broken-doc icon** → SPA CSP missing `frame-src 'self'`.
3. **Listmonk 400 "subscriber not found"** → `listmonkSendTx` auto-upserts and retries once. If you build a new client, mirror that retry, don't re-implement from scratch.
4. **Template id `null`** → KV cache stale; `wrangler kv key delete --binding=CACHE "listmonk:tpl:v1"`.
5. **`wrangler deploy` 403** → use `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`, not the modern API token form. See memory `feedback_cf_wrangler_remote_auth.md`.
6. **D1 transaction errors** → there are no transactions. Use `db.batch([...])`.
7. **Schema CHECK constraint silently rejects writes** → if a status enum widens, recreate the table (PRAGMA foreign_keys=OFF; CREATE _new; INSERT SELECT; DROP; RENAME). See `~/.claude/rules/failed-pipeline-protocol.md`.

## AI Chat side panel

The floating launcher pill (bottom-right of every page) opens the in-product AI assistant — see `src/web/components/ai-chat/` and the worker route `src/worker/routes/assistant.ts`.

- **Contracts are shared** — `src/shared/ai-chat.ts` defines `ChatRequest`, `ChatResponse`, `Widget`, `PageContext`, and the SSE event names. Both the worker route and the SPA component import from there.
- **`pageContext` is captured client-side** — `usePageContext()` snapshots path / title / first 8 headings / current selection on SPA navigation; the worker schema accepts it and prepends it as a cached system note before the user transcript.
- **Slash commands** live in `src/web/components/ai-chat/commands.ts` (`ui` / `nav` / `widget` / `prompt` kinds). Add a record and re-run `npm test -- ai-chat/commands`.
- **Widgets** are typed payloads rendered natively by `src/web/components/ai-chat/widgets.tsx`. Every `href` flows through `isSafeUrl()` (https-only) or a tiny internal-prefix allowlist.
- **Persistence** — `localStorage["mpdf.chat.threads.v2"]` holds up to 12 threads with `schemaVersion: 1`. Older / corrupt payloads reset to empty rather than crash.
- **Rate limits** — KV key `ratelimit:assistant:<userId|ip:X>:<YYYY-MM-DD>`, 26h TTL. Limits per plan: anon 5, free 30, pro 300, unlimited 2000. Quota mirror at `GET /api/assistant/quota`.
- **Streaming SSE** — events on `\n\n` boundaries: `token` (text delta), `widget` (single Widget), `done` (durationMs + token counts + remaining), `error`. Client uses `AbortController` for the Stop button.

See [`docs/ai-chat.md`](docs/ai-chat.md), [`docs/ai-chat-widgets.md`](docs/ai-chat-widgets.md), and [`docs/ai-chat-commands.md`](docs/ai-chat-commands.md) for the deep dive.

## Reference docs

- [`README.md`](README.md) — high-level summary + setup.
- [`docs/architecture.md`](docs/architecture.md) — deep dive.
- [`docs/development.md`](docs/development.md) — dev workflows.
- [`docs/deployment.md`](docs/deployment.md) — deploy + rollback.
- [`docs/security.md`](docs/security.md) — CSP, auth, secrets.
- [`docs/testing.md`](docs/testing.md) — test strategy.
- [`docs/decisions.md`](docs/decisions.md) — ADRs.
- [`docs/ai-chat.md`](docs/ai-chat.md) — AI Chat side panel architecture.
- [`docs/ai-chat-widgets.md`](docs/ai-chat-widgets.md) — widget registry reference.
- [`docs/ai-chat-commands.md`](docs/ai-chat-commands.md) — slash-command registry.
