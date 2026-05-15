# AI Chat Side Panel

In-product AI concierge for Megabyte PDF. Lives at `src/web/components/ai-chat/`, mounts globally from `src/web/main.tsx`, and talks to `/api/assistant/chat` on the Worker.

## Surface

- **Launcher** — floating gradient pill (bottom-right). Cmd/Ctrl+K toggles. Fades in ~1.2s after first paint so it never competes with the hero.
- **Panel** — slide-in `<aside role="dialog">`, 440px desktop, full-screen mobile. Escape closes and restores focus to the launcher.
- **Header** — History toggle · New chat · Export current thread (.json) · Close.
- **Body** — empty state with chip suggestions, or the streamed conversation (user / assistant bubbles, widgets, error / stopped chips).
- **Footer** — toolbar (Commands · Regenerate · Copy last · Stop) and the composer.
- **Composer** — auto-resizing textarea, slash-menu, Send / Stop button. `Enter` sends, `Shift+Enter` newlines, `/` opens the slash palette, arrow keys navigate it, `Enter`/`Tab` picks, `Esc` dismisses.

## Architecture

```
src/web/components/ai-chat/
├── index.ts            ← public barrel
├── AiChatPanel.tsx     ← top-level UI shell + command runner
├── Composer.tsx        ← textarea + slash menu integration
├── SlashMenu.tsx       ← pure UI palette (keyboard nav lives in parent)
├── useChat.ts          ← state machine: threads, SSE streaming, abort, regenerate
├── usePageContext.ts   ← captures path / title / headings / selection on SPA route changes
├── storage.ts          ← localStorage + schema-versioned thread store
├── markdown.ts         ← safe markdown → HTML (escape, fenced code, safe links)
├── commands.ts         ← 33-command registry (ui | nav | widget | prompt)
├── widgets.tsx         ← 23-case widget renderer + sub-views (lightbox, gallery, video…)
└── types.ts            ← re-exports from src/shared/ai-chat.ts + local Message/Thread/Store
```

Cross-boundary contracts live in **`src/shared/ai-chat.ts`** so the Worker and the SPA agree on the same `ChatRequest`, `ChatResponse`, `Widget`, `PageContext`, and SSE event names.

## Streaming

The client `POST`s to `/api/assistant/chat` with `{ messages, thread?, pageContext?, documentContext? }`. The Worker streams Server-Sent Events parsed on `\n\n`:

| Event    | Payload                                                              |
| -------- | -------------------------------------------------------------------- |
| `token`  | `{ text: string }` — append to the current assistant message.        |
| `widget` | `Widget` (discriminated union) — push a rendered widget onto the message. |
| `done`   | `{ durationMs, inputTokens, outputTokens, limit, remaining }`         |
| `error`  | `{ message: string }` — surface inline, mark message as `errored`.   |

Stop is wired via `AbortController` — `useChat.stop()` aborts the in-flight `fetch`, the partial transcript is preserved with a `stopped` chip.

## Server-emitted widgets

The model can render rich widgets natively via the `render_widget` tool — no slash command required. The flow:

1. Worker passes the `RENDER_WIDGET_TOOL` definition (from `src/worker/lib/widget-schema.ts`) on every `messages.create` call.
2. SYSTEM prompt teaches the model to call `render_widget` instead of writing markdown when the answer is structured (pricing tables, FAQs, link lists, step-by-step guides, stat grids, comparison tables).
3. Anthropic streams a `tool_use` content block: `content_block_start` (kind=`tool_use`, name=`render_widget`) → repeated `content_block_delta` (`input_json_delta` with `partial_json` chunks) → `content_block_stop`.
4. The stream loop in `src/worker/routes/assistant.ts` accumulates the partial JSON, parses on stop, validates with Zod (`validateWidget`), and emits an SSE `widget` event identical to the shape produced by client-side widget commands.
5. Invalid payloads are dropped (with Sentry capture); the user still sees the prose the model already streamed.
6. Cap: at most **3** server-emitted widgets per turn — defends against runaway tool calls.

`src/worker/lib/widget-schema.ts` is the single source of truth for the discriminated Zod union covering all 34 `WidgetKind`s. Bundle stays web-side bundle-free — Zod only runs in the Worker.

## Plans + rate limits

`ASSISTANT_RATE_LIMITS = { anon: 5, free: 30, pro: 300, unlimited: 2000 }` (turns / day / user-or-IP). KV key: `ratelimit:assistant:<userId|ip:X>:<YYYY-MM-DD>`, 26-hour TTL. Quota mirror lives at `GET /api/assistant/quota`.

Model routing:

- Paid plans (Pro, Unlimited) → `claude-sonnet-4-6`
- Anon, Free → `claude-haiku-4-5-20251001`

## Persistence

- Threads: `localStorage["mpdf.chat.threads.v2"]` (`ThreadStore` with `schemaVersion: 1`; up to 12 threads, LRU-trimmed).
- Active thread id: `localStorage["mpdf.chat.active.v2"]`.
- Corrupt JSON or older payloads (`v1` or no `schemaVersion`) reset to an empty store rather than crash.

## Slash commands

See [`./ai-chat-commands.md`](./ai-chat-commands.md) for the full registry. Three execution paths:

- `ui`     — runs a local action (`new`, `clear`, `export`, `copyLast`, `stop`, `regenerate`, `settings`, `feedback`).
- `nav`    — navigates the SPA to `cmd.href` after a tiny visible echo + CTA widget.
- `widget` — pushes a pre-canned assistant message (intro + widgets) with no model call.
- `prompt` — transforms `/cmd args` → a richer prompt and streams it through the model.

## Widgets

See [`./ai-chat-widgets.md`](./ai-chat-widgets.md). Every `href` is filtered through `isSafeUrl` (https-only) or an allowlist of internal prefixes (`/`, `mailto:`).

## Accessibility

- `role="dialog"` + `aria-labelledby` (a `useId()` heading) on the panel.
- Focus moves to the composer on open and back to the launcher on close.
- `body.aichat-no-scroll` locks the page behind the panel on mobile.
- Honors `prefers-reduced-motion` (transitions reduced to 1ms).
- All controls keyboard-reachable; the slash menu announces via `role="listbox"` + `aria-selected`.

## Security

- Output sanitization — every model token flows through `escapeHtml` and the safe-markdown renderer; raw HTML never reaches `dangerouslySetInnerHTML` un-escaped.
- Link safety — `isSafeUrl` enforces `https?://…` only; widgets reject other schemes; non-safe markdown links render as plain text.
- Input cap — composer hard-stops at 6,000 characters; the Worker schema caps each `message.content` at 8,000 and the transcript at 40 turns.
- CSP — the SPA's strict CSP applies (script-src 'self' + nonces). The panel does not inject inline scripts.

## Observability

- Every stream adds a Sentry breadcrumb (`category: ai`, `message: assistant.stream`) with plan, turn count, page path, and context flags.
- Failure paths capture exceptions explicitly (`Sentry.captureException`).
- Stream success records `durationMs`, `inputTokens`, `outputTokens`.

## Local dev

```bash
npm run dev          # web on :5173, worker on :8787
# open http://localhost:5173 → click the launcher (bottom-right) or press Cmd/Ctrl+K
```

The Worker route is `src/worker/routes/assistant.ts`. When `ANTHROPIC_API_KEY` is missing it returns 503; the UI surfaces a clear inline error instead of pretending to work.

## Tests

- Unit (Vitest): `src/web/components/ai-chat/{commands,markdown,storage}.test.ts`.
- E2E (Playwright): `tests/ai-chat.spec.ts` — launcher visibility, panel open + composer focus, slash menu, Escape-to-close, `/api/assistant/quota`.

Run with `npm test` and `npm run test:e2e`.
