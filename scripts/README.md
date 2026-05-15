# `scripts/`

Operational helpers that live outside the Worker. Each is documented below
with its purpose, required env, how to run it, and what it touches in
production.

## `deploy.sh`

Wraps `wrangler deploy --env production` with pre-flight checks: confirms
working tree is clean, runs `typecheck + lint + test + build`, then deploys
and tails the worker for ~30 s to catch boot-time errors.

Run: `./scripts/deploy.sh`

Requires: `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` (not the modern API
token form — see `feedback_cf_wrangler_remote_auth` memory).

## `listmonk-sync.mjs`

Pushes `emails/*.html` templates to Listmonk via its admin API. Creates
templates on first run, updates them on subsequent runs (matches on alias).

Run: `node scripts/listmonk-sync.mjs`

Requires: `LISTMONK_URL`, `LISTMONK_API_USER`, `LISTMONK_API_TOKEN`.
After running, clear the KV alias→id cache so the Worker picks up new IDs:

```bash
wrangler kv key delete --binding=CACHE "listmonk:tpl:v1" --env production
```

## `smoke.mjs`

Hits the production health + a small set of API endpoints, asserting
status + content-type + cache headers. Used in CI and post-deploy.

Run: `node scripts/smoke.mjs https://pdf.megabyte.space`

## `smoke-multi.mjs`

Same as `smoke.mjs` but runs the suite against a list of URLs in parallel.
Used for cross-environment checks (prod + preview + local).

Run: `node scripts/smoke-multi.mjs prod=https://pdf.megabyte.space local=http://localhost:8787`

## `seed-community-pdfs.sql`

D1 seed script for the public `/explore` page. Idempotent — uses
`INSERT OR IGNORE`. **Never run against production without dry-running
locally first.**

Apply locally:

```bash
wrangler d1 execute pdf-db --file=scripts/seed-community-pdfs.sql
```

Production reseeding is a controlled operation — log it in
`docs/maintenance.md` § Routine cadence.
