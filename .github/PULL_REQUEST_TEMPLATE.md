<!--
Thanks for the PR! Keep it tight — one topic per PR. See CONTRIBUTING.md.
-->

## What

<!-- One or two sentences. What does this change do? -->

## Why

<!-- The motivating bug / feature / refactor. Link issues if any: Fixes #123 -->

## Test plan

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Manually verified the change in `npm run dev`
- [ ] `npm run test:e2e` passes (only if user-visible)

## Risk

<!-- What could break? Anything reviewers should pay extra attention to? -->

## Checklist

- [ ] Updated docs (`README.md`, `CLAUDE.md`, `docs/*`) if behavior changed.
- [ ] Added/updated tests for any new logic.
- [ ] If a new Worker route prefix needs server rendering, added it to
      `[assets].run_worker_first` in `wrangler.toml`.
- [ ] If a new external origin was added, updated the relevant directive in
      `src/worker/lib/security-headers.ts` (never relaxed globally).
- [ ] If a new transactional flow was added, the Listmonk template was
      synced via `scripts/listmonk-sync.mjs`.
