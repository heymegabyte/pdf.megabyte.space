# Deployment

How to ship Megabyte PDF to production safely, plus rollback and the post-deploy verification you should run every time.

## TL;DR

```bash
./scripts/deploy.sh
```

This script handles typecheck → build → D1 migrations → `wrangler deploy` → optional cache purge → smoke test. Set `DRY_RUN=1` to preview, `SKIP_SMOKE=1` to skip the smoke pass.

If you want the manual path:

```bash
npm run typecheck
npm run build
npm run db:apply:prod
npm run deploy   # = npm run build && wrangler deploy
```

## Pre-deploy checklist

1. **Tests green** — `npm run typecheck && npm run lint && npm test && npm run build`.
2. **Migrations exist for any schema change** — `drizzle/` contains a new file.
3. **Secrets up to date** — any new env var has been set via `wrangler secret put`.
4. **`run_worker_first` covers new server-rendered prefixes** — any new RSS/feed/OG/iframe endpoint listed in `wrangler.toml`.
5. **CSP allows new third parties** — any new external script/origin added to `strictSecureHeaders` in `src/worker/index.ts`.
6. **`emails/*.html` synced** — `node scripts/listmonk-sync.mjs` after template edits.

## Auth

`wrangler` reads credentials from one of:

- `~/.wrangler/config/default.toml` (set up by `wrangler login`).
- `CLOUDFLARE_API_TOKEN` env var (token scoped to `Workers Scripts:Edit`, `D1:Edit`, `R2:Edit`, `Workers KV:Edit`).
- `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` env vars (legacy global-key path).

Memory `feedback_cf_wrangler_remote_auth.md` notes that `CLOUDFLARE_API_KEY` + `EMAIL` is the path that has worked reliably for this account. Use that if a token-based deploy 403s.

## Secret management

```bash
# Set / rotate
wrangler secret put SENTRY_DSN
wrangler secret put LISTMONK_API_TOKEN
wrangler secret put STRIPE_SECRET_KEY

# List (names only — values never echoed)
wrangler secret list

# Delete
wrangler secret delete STRIPE_SECRET_KEY
```

Public, non-secret config lives in `wrangler.toml` under `[vars]` and is committed.

## Cache purge

Two caches matter:

1. **Cloudflare zone cache** — purged automatically by `scripts/deploy.sh` if `CF_ZONE_ID` + `CLOUDFLARE_API_TOKEN` are set:

   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

2. **KV `CACHE` namespace** — bust specific keys only when their input changed:

   ```bash
   # Listmonk template alias map (1-day TTL)
   wrangler kv key delete --binding=CACHE "listmonk:tpl:v1"
   ```

## Post-deploy verification

Run these in order. Stop at the first failure and roll back.

```bash
# 1. Worker is healthy
curl -s https://pdf.megabyte.space/api/health | jq .
# Expect: { "status": "ok", "checks": { "db": true, "latencyMs": <100 }, ... }

# 2. SPA shell loads
curl -sI https://pdf.megabyte.space/ | head -5
# Expect: HTTP/2 200, content-type: text/html

# 3. RSS feed returns XML, not HTML
curl -sI https://pdf.megabyte.space/podcast/feed.xml | grep -i content-type
# Expect: content-type: application/rss+xml; charset=utf-8

# 4. Sitemap returns XML
curl -sI https://pdf.megabyte.space/sitemap.xml | grep -i content-type
# Expect: content-type: application/xml; charset=utf-8

# 5. /api/config returns expected runtime flags
curl -s https://pdf.megabyte.space/api/config | jq .

# 6. Newsletter endpoint still accepts signups (use a throwaway address)
curl -s -X POST https://pdf.megabyte.space/api/newsletter/subscribe \
  -H 'content-type: application/json' \
  -d '{"email":"deploy-check+'$(date +%s)'@megabyte.space","source":"deploy_smoke"}' | jq .
# Expect: { "ok": true }

# 7. Browser smoke at 6 breakpoints
SMOKE_URL="https://pdf.megabyte.space" node scripts/smoke.mjs
```

If anything user-visible changed, also run `npm run test:e2e` with `PROD_URL=https://pdf.megabyte.space`.

## Rollback

There are two rollback flavours. Pick the one that fits.

### Worker code rollback

`wrangler deployments list` shows recent versions with their IDs:

```bash
wrangler deployments list
wrangler rollback --version-id <deployment_id>
```

This re-promotes a prior Worker version without rebuilding. The rolled-back Worker runs against the **current** D1 + KV + R2 state, so this only works if the schema hasn't moved.

### Migration rollback (D1)

D1 has no schema-down migrations. Recover via Time Travel within the 30-day window:

```bash
# See restore points
wrangler d1 time-travel info megabyte-pdf

# Pick a bookmark from before the bad migration
wrangler d1 time-travel restore megabyte-pdf --bookmark <bookmark>
```

If you must roll forward instead, write a corrective migration (DROP COLUMN / DROP INDEX / etc.), generate it through `npm run db:generate`, apply with `npm run db:apply:prod`.

Reference rule: `~/.claude/rules/failed-pipeline-protocol.md` — never re-queue against an unfixed schema. Fix the cause, verify the fix in isolation, then redeploy.

## Cron deployments

Schedules are owned by `wrangler.toml` under `[triggers].crons`. Editing the array and redeploying is enough — Cloudflare reconciles. To trigger a cron manually for testing:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/scripts/megabyte-pdf/schedule" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

Or set `CRON_SECRET` and hit the internal trigger route directly (see `src/worker/cron.ts` for the test hook).

## Monitoring

- **Sentry** — `https://sentry.megabyte.space/projects/megabyte-pdf/` for Worker + browser errors. Releases tagged with `SENTRY_RELEASE` env var when set.
- **PostHog** — `https://us.posthog.com/project/<id>` for product events. Key events: `newsletter_signup`, `podcast_platform_click`, `editor_export`, `share_link_created`.
- **Cloudflare dashboard** — Workers → megabyte-pdf for invocation count, CPU time, error rate. D1 → megabyte-pdf for query latency.

## Domain / DNS

Custom domain binding is owned by `wrangler.toml`:

```toml
[[routes]]
pattern = "pdf.megabyte.space"
custom_domain = true
```

The DNS record is managed in Cloudflare. If the domain ever stops resolving, check that the route still appears in `wrangler.toml`, the Cloudflare zone owns `pdf.megabyte.space`, and the certificate is provisioned (Cloudflare → SSL/TLS → Edge Certificates).

## Common deploy failures

| Failure                                                  | Fix                                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Error: A request to the Cloudflare API ... failed (971)` | Rate-limited. Wait 30s and retry — the API allows roughly 1 deploy per minute per script. |
| `Error: Failed to upload script` / 403                   | Token scope. Re-issue token with `Workers Scripts:Edit`. Or fall back to API key + email. |
| `Migration <NN> already applied`                         | Harmless — `--remote` records applied migrations. Continue.                               |
| Deploy succeeds, prod returns SPA HTML for `/podcast/feed.xml` | Missing `/podcast/*` in `run_worker_first`. Fix `wrangler.toml`, redeploy.                |
| `Error: D1_ERROR: SQLITE_ERROR` after deploy             | Schema CHECK constraint rejecting writes. Verify `sqlite_master` matches code expectations. |
