# Contributing

This is a single-Worker SaaS owned by Megabyte Labs. External PRs are welcome for bug fixes, docs, and small improvements; large changes should start as a [GitHub Discussion](https://github.com/megabytelabs/megabyte-pdf/discussions) so we can align on direction before code is written.

## Getting set up

Prerequisites: Node ≥ 20, [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 4.x. Steps:

```bash
git clone <repo>
cd megabyte-pdf
npm ci
cp .env.example .dev.vars        # fill in local secrets
npm run db:apply:local           # apply migrations to the local D1
npm run dev                      # web on :5173, worker on :8787
```

See [`docs/development.md`](docs/development.md) for the full dev loop, debugging tips, and how the SPA + Worker split works.

## Branch + PR workflow

- One topic per PR. Keep the diff small enough to read end-to-end.
- Branch off `main`. PRs target `main` and are squash-merged.
- Write meaningful commit messages — they become release-note bullets.
- Add or update tests for any behavior you change. Coverage requirements live in [`docs/testing.md`](docs/testing.md).
- Update relevant docs (`README.md`, `CLAUDE.md`, files under `docs/`) in the same PR.

## Required checks (run locally before opening a PR)

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

CI re-runs the same set on every push (`.github/workflows/ci.yml`). All four must be green.

If your change is user-visible, also run the smoke flow:

```bash
npm run test:e2e
```

## Coding standards

- TypeScript strict, `noUncheckedIndexedAccess` enabled — never cast, always guard.
- No `any`. Use `unknown` then narrow.
- Functions ≤ 50 lines, cyclomatic ≤ 10, params ≤ 3. Split when a handler grows.
- Zod validates every request body. Inline Hono handlers (don't extract into controller files).
- Side effects after a response use `c.executionCtx.waitUntil(...)`.
- Errors flow through the centralized `app.onError()` → `{ error, code }` envelope.

Full conventions in [`CLAUDE.md`](CLAUDE.md).

## Routing changes

If you add a new Worker route prefix that needs server rendering (RSS, OG image, redirect, iframe-only HTML), **add the prefix to `[assets].run_worker_first` in `wrangler.toml`** or the Cloudflare Assets binding will intercept it and serve the SPA shell. This is the canonical incident: `/podcast/feed.xml` first deploy returned `text/html` because `/podcast/*` was missing from the list.

## CSP changes

Every new external script, image origin, font host, frame source goes in `src/worker/lib/security-headers.ts`. Never loosen the global CSP — narrow the directive for the origin you need.

## Security disclosures

Do **not** open a public issue for security bugs. Email `hey@megabyte.space` with a description + repro and we'll respond within 48 hours.

## License

By submitting a PR you agree your contribution is licensed under the same terms as the project (see [`LICENSE`](LICENSE)).
