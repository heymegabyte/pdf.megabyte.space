# Maintenance Runbook

Routine operations + on-call recipes for [pdf.megabyte.space](https://pdf.megabyte.space). All commands assume the repo root + a shell with `wrangler` 4.x and Node ≥ 20 installed.

## On-call quick links

- **Worker logs (live tail):** `wrangler tail --env production --format=json`
- **Cloudflare dashboard:** https://dash.cloudflare.com → Workers & Pages → `megabyte-pdf`
- **Sentry issues:** https://sentry.io/organizations/megabyte-labs/projects/megabyte-pdf/
- **PostHog dashboards:** https://us.posthog.com/project/<id>/dashboard
- **Listmonk admin:** https://listmonk.megabyte.space

## Routine cadence

| Cadence       | Task                                                                  | Command / link                                                  |
| ------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| Daily         | Glance Sentry inbox + worker error rate                               | Sentry → Issues (last 24h)                                      |
| Weekly        | Review email send volume + bounce/complaint rate in Listmonk          | Listmonk → Campaigns + transactional logs                       |
| Weekly        | Confirm scheduled crons fired (`worker.cron.<name>` events in Sentry) | Sentry → Performance                                            |
| Monthly       | Rotate non-secret config knobs if needed                              | edit `wrangler.toml` `[vars]`, redeploy                         |
| Quarterly     | Rotate `SESSION_SECRET` + `EMAIL_UNSUB_SECRET` (see below)            | `wrangler secret put …`                                         |
| Quarterly     | `npm outdated` review, bump deps incrementally                        | see `Dependency upgrades` below                                 |
| After deploys | Verify `/api/health` returns `status:"ok"` + version hash             | `curl -s https://pdf.megabyte.space/api/health \| jq`           |

## Secrets rotation

All secrets live as Cloudflare Worker secrets (production) or `.dev.vars` (local). Never check them into git.

### Rotate `SESSION_SECRET`

Cookies signed with the old secret are invalidated — every user is logged out. Schedule outside peak hours.

```bash
openssl rand -hex 32 | tr -d '\n' | wrangler secret put SESSION_SECRET --env production
```

### Rotate `EMAIL_UNSUB_SECRET`

In-flight unsubscribe links signed with the old key will 400. Acceptable trade-off — fresh emails sign with the new key immediately.

```bash
openssl rand -hex 32 | tr -d '\n' | wrangler secret put EMAIL_UNSUB_SECRET --env production
```

### Rotate `ANTHROPIC_API_KEY`

1. Create a new key at https://console.anthropic.com/settings/keys (do not revoke old yet).
2. `wrangler secret put ANTHROPIC_API_KEY --env production` and paste new value.
3. Verify chat works end-to-end on production.
4. Revoke the old key.

### Rotate `LISTMONK_API_TOKEN`

1. Create a new API user in Listmonk → Users → API users.
2. `wrangler secret put LISTMONK_API_TOKEN --env production` (and update `LISTMONK_API_USER` if renamed).
3. Send a test transactional via `/api/email/test` (admin-only).
4. Disable the old API user in Listmonk.

### Rotate `STRIPE_*`

Stripe keys are rolled via dashboard → Developers → API keys → Roll. Update both `STRIPE_SECRET_KEY` and the corresponding webhook signing secret atomically:

```bash
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
```

Then confirm a webhook arrives via Stripe Dashboard → Developers → Webhooks → Send test event.

## KV cache hygiene

Cached values, all under the `CACHE` binding:

| Key prefix                    | TTL    | Purpose                                                              | Clear when                                |
| ----------------------------- | ------ | -------------------------------------------------------------------- | ----------------------------------------- |
| `listmonk:tpl:v1`             | 1 day  | Listmonk template alias → numeric id resolution                      | A template alias is renamed or recreated  |
| `ratelimit:<feature>:<ip>:<date>` | 26 hr | Per-IP daily counters (newsletter, podcast, etc.)                | Never — let them expire                   |
| `og:<slug>:v1`                | 7 day  | Generated OG image bytes per shared PDF                              | A shared PDF title changes pre-cache TTL  |
| `thumb:<slug>:v1`             | 7 day  | Brand-card thumb SVG per public slug                                 | Same as above                             |

### Drop a single cache key

```bash
wrangler kv key delete --binding=CACHE --remote "listmonk:tpl:v1"
```

### Inspect keys with a prefix

```bash
wrangler kv key list --binding=CACHE --remote --prefix="ratelimit:newsletter:"
```

## D1 backups + recovery

D1 ships [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) — 30-day point-in-time recovery for the production database. No manual cron required.

### Inspect available restore points

```bash
wrangler d1 time-travel info megabyte-pdf
```

### Restore to a timestamp

Destructive — coordinate with users first. Restores into a new bookmark you can then promote.

```bash
wrangler d1 time-travel restore megabyte-pdf --timestamp=2026-05-15T03:00:00Z
```

### Off-site export (for archival)

```bash
wrangler d1 export megabyte-pdf --remote --output=backups/$(date +%F).sql
```

Stash the file in an R2 archive bucket, NOT in git.

## Listmonk template sync

`scripts/listmonk-sync.mjs` pushes every `emails/<NN>-<name>.html` to Listmonk as a transactional template. Run after any template edit:

```bash
LISTMONK_BASE_URL=https://listmonk.megabyte.space \
LISTMONK_API_USER=automation \
LISTMONK_API_TOKEN=... \
node scripts/listmonk-sync.mjs
```

Then **always** purge the alias→id KV cache so the worker picks up the new id:

```bash
wrangler kv key delete --binding=CACHE --remote "listmonk:tpl:v1"
```

If you renamed an alias, delete the old template in Listmonk afterwards to avoid drift.

## Dependency upgrades

Strategy: small, frequent, gated by the full test suite. No mass `npm update`.

```bash
npm outdated                  # list drift
npm install pkg@latest        # one package at a time for risky deltas
npm run typecheck && npm run lint && npm test && npm run build
```

Higher-risk packages (lockstep with infra): `@cloudflare/puppeteer`, `wrangler`, `hono`, `drizzle-orm`, `@sentry/cloudflare`. Upgrade these in their own PR with a smoke pass against production after deploy.

## Common runbooks

### Worker returning 500s globally

1. `wrangler tail --env production --format=json | jq 'select(.outcome != "ok")'` — see the actual exception.
2. Cross-check Sentry for the stack trace.
3. If a recent deploy is the cause: `wrangler rollback` to the prior version.
4. File a Sentry release-flag comment so the bad version is marked.

### `/api/health` returns `status:"degraded"`

`checks.db: false` means the D1 read in the health probe threw. Check:

- D1 dashboard for storage/quota.
- Recent migrations applied to prod (`wrangler d1 migrations list megabyte-pdf --remote`).
- Schema CHECK constraint conflicts (see `~/.claude/rules/failed-pipeline-protocol.md`).

### Emails not sending

1. Confirm Listmonk reachable from the worker — open the admin panel.
2. Check Sentry for `listmonk send failed` warnings; they include the template alias + status code.
3. If a template alias resolution is failing: drop `listmonk:tpl:v1` and re-run a send.
4. If a single recipient blocks: Listmonk → Subscribers → Bounces.

### Stale PDF preview or OG card

Both are cached in R2 / KV for 7 days. Force regeneration:

```bash
# Drop OG cache
wrangler kv key delete --binding=CACHE --remote "og:<slug>:v1"
wrangler kv key delete --binding=CACHE --remote "thumb:<slug>:v1"
# Force a fresh PDF render
curl -X POST -H "Cookie: __session=<your session>" \
  "https://pdf.megabyte.space/api/projects/<id>/render"
```

### Wrangler deploy fails with 403

You're using a modern Cloudflare API **token**. This worker's pipeline requires the legacy global key. See `docs/deployment.md` and memory `feedback_cf_wrangler_remote_auth.md`:

```bash
export CLOUDFLARE_API_KEY=<global key from /profile/api-tokens>
export CLOUDFLARE_EMAIL=<account email>
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env production
```

## What this runbook is _not_

- It is not a substitute for `docs/deployment.md` (deploy/rollback) or `docs/security.md` (CSP/auth). Read those first.
- It is not the place to invent new architecture. Significant changes belong in `docs/decisions.md` as ADRs.
