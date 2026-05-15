# Development

How to work on Megabyte PDF locally, plus the workflows you'll repeat most often.

## Prerequisites

- Node ≥ 20
- npm 10+
- A Cloudflare account with Workers/D1/R2/KV enabled
- `wrangler` 4.x (installed via `npm install`)

## First-time setup

```bash
git clone <repo>
cd megabyte-pdf
npm install
```

Drop credentials into `.dev.vars` at the repo root (gitignored). Minimum to boot the editor end-to-end:

```bash
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=$(openssl rand -hex 32)
LISTMONK_BASE_URL=https://listmonk.megabyte.space
LISTMONK_API_USER=automation
LISTMONK_API_TOKEN=...
LISTMONK_FROM_EMAIL=hello@megabyte.space
LISTMONK_FROM_NAME=Megabyte PDF
EMAIL_UNSUB_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=hey@megabyte.space
```

Apply migrations to the local D1:

```bash
npm run db:apply:local
```

Seed community-PDF fixtures (optional, but the Explore page is empty without them):

```bash
npm run db:seed:local
```

## Dev loop

```bash
npm run dev
```

This runs `vite` (port 5173) and `wrangler dev` (port 8787) concurrently. Vite proxies `/api/*` and `/s/*` to the Worker. Open <http://localhost:5173>.

| Command            | When to use                                                  |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Full app — frontend + Worker                                 |
| `npm run dev:web`  | Frontend only. Fastest HMR. API calls 502 until Wrangler runs |
| `npm run dev:api`  | Worker only. Useful when only touching `src/worker/`         |

### Hot reload

- Vite HMR is instant for everything under `src/web/`.
- Wrangler restarts on `src/worker/`, `wrangler.toml`, and `.dev.vars` changes — that's a 1-2 second cycle.
- Tailwind 4 picks up new classes automatically (no `content` config needed).

### Vite proxy

```ts
proxy: {
  "/api": { target: "http://localhost:8787", changeOrigin: true },
  "/s":   { target: "http://localhost:8787", changeOrigin: true },
}
```

Any new server-rendered prefix you add to the Worker should also be proxied here, or the SPA dev server will try (and fail) to serve it from `dist/`.

## D1 schema changes

```bash
# 1. Edit src/worker/db/schema.ts.
# 2. Generate a new SQL migration.
npm run db:generate

# 3. Apply locally.
npm run db:apply:local

# 4. Restart `npm run dev:api` so the Worker picks up the new schema.
```

For local schema inspection:

```bash
wrangler d1 execute megabyte-pdf --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

To reset local D1 entirely:

```bash
rm -rf .wrangler/state/v3/d1
npm run db:apply:local
npm run db:seed:local
```

## Listmonk

Local Worker dev reads Listmonk credentials from `.dev.vars` and writes to the production Listmonk instance at `https://listmonk.megabyte.space`. That's intentional — there's no staging Listmonk, and the API user is scoped to template + subscriber writes only.

If you change a template:

```bash
node scripts/listmonk-sync.mjs
# bust the KV alias cache so the Worker re-reads the template map
wrangler kv key delete --binding=CACHE "listmonk:tpl:v1"
```

If you don't want to send during local dev, just leave the Listmonk vars unset in `.dev.vars`. The newsletter/podcast endpoints fall back to "Listmonk disabled" mode (accept the signup, log a Sentry warning, return `{ ok: true, queued: true }`).

## Frontend gotchas

- **React 19 Server Components**: not used. This is a pure CSR SPA — every component is client-side.
- **`noUncheckedIndexedAccess`**: accessing `array[i]` returns `T | undefined`. Use `?? defaultValue` or an explicit guard.
- **`null` vs `undefined`**: D1 columns marshal as `null`; React props prefer `undefined`. Convert at the boundary (`row.title ?? undefined`).
- **CodeMirror state**: keep the editor mount inside an `useEffect` with a stable dep array. Re-creating the editor on every render eats memory and loses cursor position.

## Worker gotchas

- **No `Buffer` in the Worker runtime**. Use `Uint8Array` + `TextEncoder` / `TextDecoder`.
- **No `process.env`**. Read everything from `c.env`.
- **CPU budget**: 50 ms (free) / 30 s (paid). Use `c.executionCtx.waitUntil(...)` for fire-and-forget work.
- **D1 has no transactions**. Use `db.batch([...])` for multi-statement writes.
- **Console output**: use plain `console.log` / `console.error`. `wrangler dev` prints them inline; `wrangler tail` streams them from prod.

## Code organisation

- One Hono sub-app per file in `src/worker/routes/`. Mount in `index.ts`. Don't grow `index.ts` beyond the routing scaffold + sitemap + feed + CSP.
- Shared server utilities go in `src/worker/lib/`. Keep them framework-agnostic where possible (`listmonk.ts` only depends on `Env`).
- React components live in `src/web/components/` (presentational + reusable) or `src/web/pages/` (route-level). Routes are wired in `src/web/main.tsx`.
- Tailwind utility classes inline; brand tokens come from `styles.css`. Don't add a second CSS-in-JS library.

## Useful one-liners

```bash
# Tail prod logs
wrangler tail --env production --format=json

# Inspect prod D1 rows
wrangler d1 execute megabyte-pdf --remote --command "SELECT count(*) FROM projects WHERE is_public=1;"

# List prod secrets (names only)
wrangler secret list

# Time-travel restore (30-day window)
wrangler d1 time-travel info megabyte-pdf
wrangler d1 time-travel restore megabyte-pdf --bookmark <bookmark>
```

## Before you push

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All four must pass. If the change is user-visible, also:

```bash
npm run test:e2e
```

See [`docs/testing.md`](testing.md) for what each test layer covers.
