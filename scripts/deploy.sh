#!/usr/bin/env bash
set -euo pipefail

# pdf.megabyte.space deploy + smoke
# Usage:
#   ./scripts/deploy.sh              # build → migrate → deploy → purge → smoke
#   SKIP_SMOKE=1 ./scripts/deploy.sh # skip post-deploy smoke
#   DRY_RUN=1 ./scripts/deploy.sh    # show steps without executing

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '\033[1;36m▸\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

run() {
  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    printf '  [dry-run] %s\n' "$*"
  else
    "$@"
  fi
}

# 0. Preflight — wrangler auth
log "Checking wrangler auth"
if ! npx wrangler whoami >/dev/null 2>&1; then
  cat <<EOF
✗ Wrangler is not authenticated. Run one of:
    npx wrangler login                          # interactive OAuth
    export CLOUDFLARE_API_TOKEN=<token>          # token from https://dash.cloudflare.com/profile/api-tokens
  then re-run this script.
EOF
  exit 1
fi

# 1. Typecheck + build
log "Typecheck"
run npm run typecheck

log "Build"
run npm run build

# 2. D1 migrations
log "Applying D1 migrations (remote: megabyte-pdf)"
run npx wrangler d1 migrations apply megabyte-pdf --remote

# 3. Deploy worker
log "Deploying worker"
run npx wrangler deploy

# 4. Purge cache (best-effort; needs CF_ZONE_ID + CLOUDFLARE_API_TOKEN with Zone.Cache scope)
if [[ -n "${CF_ZONE_ID:-}" && -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  log "Purging Cloudflare cache for zone $CF_ZONE_ID"
  if [[ "${DRY_RUN:-0}" != "1" ]]; then
    curl -fsS -X POST \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}' >/dev/null \
      && log "Cache purged" \
      || log "Cache purge failed (continuing)"
  fi
else
  log "Skipping cache purge (set CF_ZONE_ID + CLOUDFLARE_API_TOKEN to enable)"
fi

# 5. Smoke
if [[ "${SKIP_SMOKE:-0}" != "1" ]]; then
  log "Smoke testing https://pdf.megabyte.space at 6 breakpoints"
  run env SMOKE_URL="https://pdf.megabyte.space" node scripts/smoke.mjs
else
  log "Skipping smoke (SKIP_SMOKE=1)"
fi

log "Done."
