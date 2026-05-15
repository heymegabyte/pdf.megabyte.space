# AI Chat Widgets

The chat panel renders structured `Widget` payloads inline beneath assistant text. Widgets are typed in [`src/shared/ai-chat.ts`](../src/shared/ai-chat.ts) and rendered by `src/web/components/ai-chat/widgets.tsx`.

| Kind            | Use it for                                                  | Notable payload fields                                                       |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `text`          | Plain prose paragraph                                       | `text`                                                                       |
| `markdown`      | Multi-paragraph markdown (rendered through the safe renderer) | `markdown`                                                                  |
| `callout`       | Info / success / warning / danger / tip box                 | `tone`, `markdown`                                                          |
| `cta`           | A single primary / secondary / ghost button                 | `label`, `href`, `external?`, `variant?`, `prompt?` (sends a follow-up)      |
| `link-list`     | Compact list of labelled links with optional descriptions   | `items[]`                                                                   |
| `card`          | Single card (heading + body + optional image + optional href) | `eyebrow?`, `heading`, `body`, `href?`, `image?`                            |
| `card-grid`     | Responsive grid of cards                                    | `items[]`                                                                   |
| `pricing`       | Plan comparison — Free / Pro / Unlimited                    | `plans[]` (one entry may carry `highlight: true`)                            |
| `feature-grid`  | Capability matrix (icon-less)                               | `items[]` with `heading` + `body`                                            |
| `faq`           | Q&A accordion-style list                                    | `items[]` with `q` + `a`                                                    |
| `table`         | Comparison table                                            | `columns[]`, `rows[][]`, optional `emphasis: number[]` for highlight rows    |
| `code`          | Read-only code block with one-click copy                    | `language?`, `code`, `filename?`                                            |
| `stat-grid`     | KPI strip (label + big number)                              | `items[]`                                                                   |
| `checklist`     | Setup / TODO list with checkmarks                           | `items[]` with `label` + `done?` + `note?`                                  |
| `steps`         | Numbered process / how-to                                   | `items[]` with `title` + `body?`                                            |
| `photo`         | Single image with credit                                    | `src`, `alt`, `credit?`, `href?`                                            |
| `gallery`       | Multi-image grid or carousel + Esc-closable lightbox        | `items[]`, `layout?: "grid" \| "carousel"`                                  |
| `video`         | Embedded mp4 / YouTube / Vimeo                              | `src`, `poster?`, `title?`, `provider?`                                     |
| `quote`         | Testimonial / pull-quote                                    | `text`, `cite?`, `role?`, `avatar?`                                         |
| `person`        | Team-member card                                            | `name`, `role?`, `bio?`, `avatar?`, `href?`                                 |
| `sources`       | Citation list with favicons                                 | `items[]` with `label` + `href` + `description?` + `favicon?`               |
| `suggestions`   | Follow-up prompt chips that re-fire `send(prompt)`          | `items[]` with `label` + `prompt`                                           |
| `shortcommands` | Discoverable list of slash commands                         | `items[]` with `command` + `description` + `group?`                         |
| `chart`         | Horizontal-bar comparison chart                             | `kind?`, `unit?`, `max?`, `items[]` with `label` + `value` + `sub?` + `highlight?` |
| `timeline`      | Vertical timeline (changelog, roadmap, history)             | `items[]` with `when` + `title` + `body?` + `tag?` + `href?`                |
| `rating`        | Fractional 0–5 star rating + review count                   | `value`, `max?`, `label?`, `reviews?`                                       |
| `status`        | System / subsystem health summary                           | `overall`, `items?[]` with per-row `status` + `note?`, `href?`              |
| `form`          | Inline contact / lead-capture form                          | `action?`, `submitLabel?`, `fields[]` with `name`, `label`, `type?`, `placeholder?`, `required?` |
| `search-results`| AI-routed search hits over `/explore`, templates, docs      | `items[]` with `title`, `href`, `snippet?`, `eyebrow?`, `score?`; optional `query`  |
| `alert`         | Inline severity-tagged banner with optional action + dismiss | `severity`, `heading`, `body?`, `action?` (`{label, href?, prompt?}`), `dismissible?` |
| `breadcrumb`    | Path-style navigation, last item marked `aria-current="page"` | `items[]` with `label` + optional `href`                                          |
| `multi-choice`  | Single-tap quick-reply buttons that fire a follow-up prompt | `question?`, `items[]` with `label` + `prompt` + `description?`                  |
| `before-after`  | Image comparison with draggable slider (range input)        | `before {src, alt}`, `after {src, alt}`, `beforeLabel?`, `afterLabel?`, `initial?` |
| `document`      | Downloadable file card with size + format badge             | `filename`, `href`, `bytes?`, `format?`, `description?`                          |

## Safety rules

- Every `href` flows through one of: `isSafeUrl()` (https-only regex) **or** an internal-prefix allowlist (`/`, `mailto:`).
- Unsafe URLs cause the widget to render the label as plain text — no live anchor.
- `code` blocks render through `escapeHtml`, so no embedded HTML ever escapes the `<pre><code>` boundary.
- `markdown` payloads use the same renderer as assistant prose (`src/web/components/ai-chat/markdown.ts`).
- `photo` / `gallery` URLs are loaded `loading="lazy"` and never injected via `style`.

## Authoring widgets from commands

A widget command returns one or more widgets via a `getWidgets()` factory:

```ts
{
  name: "/pricing",
  description: "See pricing plans",
  group: "Sales",
  kind: "widget",
  intro: "Here are the plans:",
  getWidgets: () => [
    {
      kind: "pricing",
      payload: {
        plans: [
          { name: "Free", price: "$0", period: "/mo", features: ["3 PDFs/day", "Watermark"], ctaLabel: "Get started", ctaHref: "/sign-in" },
          { name: "Pro", price: "$9", period: "/mo", features: ["Unlimited PDFs", "No watermark"], ctaLabel: "Upgrade", ctaHref: "/dashboard?upgrade=pro", highlight: true },
          // ...
        ],
      },
    },
  ],
}
```

`AiChatPanel` calls `useChat.pushAssistantWidgets(intro, widgets)` which appends a fresh assistant message without any model call.

## Authoring widgets from the model

The Worker may emit one or more `widget` SSE events between `token` deltas. The client appends each one to the active assistant message in order. See `src/web/components/ai-chat/useChat.ts → runStream()` for the parser.
