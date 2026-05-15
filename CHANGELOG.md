# Changelog

All notable changes to **Megabyte PDF** are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **AI Chat side panel** (`src/web/components/ai-chat/`) — replaces the legacy `AiAssistantDrawer`. Floating launcher pill (bottom-right), Cmd/Ctrl+K shortcut, slide-in dialog (440px desktop / full-screen mobile), Escape close + focus restore, multi-thread history (12-thread LRU), export/clear/regenerate/stop/copy-last toolbar.
- **33 slash commands** across 8 groups (Help, Navigation, Sales, Account, Content, Editor, Tools, Support) wired through a typed registry (`ai-chat/commands.ts`) with `ui` / `nav` / `widget` / `prompt` kinds. Arrow-key navigable palette + Enter/Tab/Escape semantics.
- **23 native response widgets** (`ai-chat/widgets.tsx`) — callouts, CTAs, feature grids, pricing cards, FAQ, comparison tables, code blocks (with copy button), photo galleries with Esc-closable lightbox, embedded video (mp4 / YouTube / Vimeo), quotes, person cards, source lists, follow-up suggestions, short-command listings, and more. All hrefs validated through an `isSafeUrl` (https-only) guard.
- **Typed chat contracts** (`src/shared/ai-chat.ts`) — discriminated-union `Widget`, structured `ChatRequest` / `ChatResponse`, SSE event-name union, `PageContext` schema for client-side route + heading + selection capture.
- **`pageContext` support in `/api/assistant/chat`** — Zod-validated, optionally injected ahead of the user transcript so the model sees what page / selection the user is asking about.
- Vitest unit tests for the slash-command registry, the safe-markdown renderer (HTML escape, code blocks, link safety), and the localStorage thread store (corrupt-JSON tolerance, schema-version gating, round-trip).
- Playwright E2E (`tests/ai-chat.spec.ts`) covering launcher visibility, panel open + composer focus, slash-menu reveal, Escape-to-close, and the `/api/assistant/quota` shape.
- `.env.example` covering every Worker secret + optional integration knob.
- `docs/maintenance.md` runbook (secret rotation, KV cache hygiene, D1 backups, Listmonk template sync, common on-call recipes).
- `.editorconfig` so cross-IDE indentation + EOL stay consistent.
- Mermaid sequence diagrams in `docs/architecture.md` for the request, auth, and transactional-email flows.
- Unit tests for `cleanTitle` (`src/worker/lib/ai-title.test.ts`), `parsePrettierOutput` (`src/worker/lib/ai-prettier.test.ts`), and `extractSection` + `ALLOWED_BLOCK_KINDS` (`src/worker/lib/ai-block.test.ts`).
- Unit tests for `isUserRenderPath` (`src/worker/lib/security-headers.test.ts`), `corsOriginMatcher` (`src/worker/lib/cors-config.test.ts`), and the XML/SVG helpers (`src/worker/lib/xml-utils.test.ts`). Coverage moved from 5 files / 66 tests to 8 files / 89 tests.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) running typecheck + lint + test + build on PRs to `main`.
- `CONTRIBUTING.md` covering branch/PR workflow, coding standards, and security disclosure path.
- `SECURITY.md` with private-disclosure path, scope, hardening summary, and coordinated-disclosure timeline.
- `.github/dependabot.yml` for grouped weekly npm + monthly GitHub Actions bumps.
- `.github/PULL_REQUEST_TEMPLATE.md` + `.github/ISSUE_TEMPLATE/{bug_report,feature_request,config}` so issues/PRs ship with the right checklists.
- `.nvmrc` pinning Node 20 to match CI.
- `scripts/README.md` documenting every helper script (deploy, listmonk-sync, smoke, smoke-multi, seed).
- MIT `LICENSE`.

### Changed

- Removed the legacy `src/web/components/AiAssistantDrawer.tsx` (749 lines). Replaced wholesale by the modular `ai-chat/` package — no API surface change for the host app: `src/web/main.tsx` simply imports `AiChatPanel` instead.
- Extracted strict CSP middleware into `src/worker/lib/security-headers.ts` (`strictSecureHeaders` + `isUserRenderPath`) and removed the ~60-line inline CSP block from `src/worker/index.ts`.
- Extracted the CORS allow-list into `src/worker/lib/cors-config.ts` so future preview-deploy origins land in one file.
- Extracted the sitemap, RSS, and JSON Feed handlers into `src/worker/routes/feeds.ts`; shrunk `src/worker/index.ts` from 602 → 327 lines.
- Extracted the `/api/og/:slug` SVG renderer into `src/worker/routes/og-card.ts`.
- Deduplicated the near-identical `xmlEscape` / `svgEscape` / `wrapWords` helpers into `src/worker/lib/xml-utils.ts` and gave them dedicated tests.
- Added module + per-export JSDoc to `src/worker/lib/drive.ts`, `src/worker/lib/templates.ts`, `src/worker/lib/ai-title.ts`, `src/worker/lib/ai-prettier.ts`, and `src/worker/lib/ai-block.ts`.
- Bumped `hono` to 4.12.18+ via `npm audit fix`, closing 3 advisories (CSS Declaration Injection, JWT numeric-date validation, Cache middleware `Vary` header).

### Fixed

- (No bugs surfaced during this pass — entries here will track issues squashed since `0.1.0`.)

### Security

- `npm audit` now reports 0 production-path vulnerabilities. Remaining 4
  moderate findings are dev-only (transitive `esbuild` via outdated
  `@esbuild-kit/esm-loader` inside `drizzle-kit`'s migration tooling); they
  cannot affect deployed traffic. Fix requires a breaking `drizzle-kit`
  downgrade and is tracked for the next major bump.
