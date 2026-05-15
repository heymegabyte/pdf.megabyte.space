/**
 * Shared contracts between the AI Chat web UI (`src/web/components/ai-chat/*`)
 * and the Worker assistant endpoint (`src/worker/routes/assistant.ts`).
 *
 * Widgets are rendered natively in the panel — never as iframes, never as
 * server-injected HTML. Each widget is a typed payload the client looks up in
 * its widget registry.
 */

export type WidgetKind =
  | "text"
  | "markdown"
  | "callout"
  | "cta"
  | "link-list"
  | "card"
  | "card-grid"
  | "pricing"
  | "feature-grid"
  | "faq"
  | "table"
  | "code"
  | "stat-grid"
  | "checklist"
  | "steps"
  | "photo"
  | "gallery"
  | "video"
  | "quote"
  | "person"
  | "sources"
  | "suggestions"
  | "shortcommands"
  | "chart"
  | "timeline"
  | "rating"
  | "status"
  | "form"
  | "search-results"
  | "alert"
  | "breadcrumb"
  | "multi-choice"
  | "before-after"
  | "document";

export interface WidgetBase<K extends WidgetKind, P> {
  kind: K;
  id?: string;
  title?: string;
  caption?: string;
  payload: P;
}

export interface CtaPayload {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  prompt?: string;
}
export type CalloutTone = "info" | "success" | "warning" | "danger" | "tip";

export type Widget =
  | WidgetBase<"text", { text: string }>
  | WidgetBase<"markdown", { markdown: string }>
  | WidgetBase<"callout", { tone: CalloutTone; markdown: string }>
  | WidgetBase<"cta", CtaPayload>
  | WidgetBase<"link-list", { items: { label: string; href: string; description?: string; external?: boolean }[] }>
  | WidgetBase<"card", { eyebrow?: string; heading: string; body: string; href?: string; image?: string }>
  | WidgetBase<
      "card-grid",
      { items: { eyebrow?: string; heading: string; body: string; href?: string; image?: string }[] }
    >
  | WidgetBase<
      "pricing",
      {
        plans: { name: string; price: string; period?: string; features: string[]; ctaLabel: string; ctaHref: string; highlight?: boolean }[];
      }
    >
  | WidgetBase<"feature-grid", { items: { icon?: string; heading: string; body: string }[] }>
  | WidgetBase<"faq", { items: { q: string; a: string }[] }>
  | WidgetBase<
      "table",
      { columns: string[]; rows: string[][]; emphasis?: number[] /* row indices to emphasize */ }
    >
  | WidgetBase<"code", { language?: string; code: string; filename?: string }>
  | WidgetBase<"stat-grid", { items: { label: string; value: string; sub?: string }[] }>
  | WidgetBase<"checklist", { items: { label: string; done?: boolean; note?: string }[] }>
  | WidgetBase<"steps", { items: { title: string; body?: string }[] }>
  | WidgetBase<"photo", { src: string; alt: string; credit?: string; href?: string }>
  | WidgetBase<
      "gallery",
      { items: { src: string; alt: string; credit?: string; href?: string }[]; layout?: "grid" | "carousel" }
    >
  | WidgetBase<"video", { src: string; poster?: string; title?: string; provider?: "mp4" | "youtube" | "vimeo" }>
  | WidgetBase<"quote", { text: string; cite?: string; role?: string; avatar?: string }>
  | WidgetBase<"person", { name: string; role?: string; bio?: string; avatar?: string; href?: string }>
  | WidgetBase<
      "sources",
      { items: { label: string; href: string; description?: string; favicon?: string }[] }
    >
  | WidgetBase<"suggestions", { items: { label: string; prompt: string }[] }>
  | WidgetBase<
      "shortcommands",
      { items: { command: string; description: string; group?: string }[] }
    >
  | WidgetBase<
      "chart",
      {
        kind?: "bar" | "h-bar";
        unit?: string;
        max?: number;
        items: { label: string; value: number; sub?: string; highlight?: boolean }[];
      }
    >
  | WidgetBase<
      "timeline",
      { items: { when: string; title: string; body?: string; tag?: string; href?: string }[] }
    >
  | WidgetBase<
      "rating",
      { value: number; max?: number; label?: string; reviews?: number }
    >
  | WidgetBase<
      "status",
      {
        overall: "operational" | "degraded" | "outage" | "maintenance";
        items?: { label: string; status: "operational" | "degraded" | "outage" | "maintenance"; note?: string }[];
        href?: string;
      }
    >
  | WidgetBase<
      "form",
      {
        action?: string;
        submitLabel?: string;
        fields: {
          name: string;
          label: string;
          type?: "text" | "email" | "textarea" | "url";
          placeholder?: string;
          required?: boolean;
        }[];
      }
    >
  | WidgetBase<
      "search-results",
      { items: { title: string; href: string; snippet?: string; eyebrow?: string; score?: number }[]; query?: string }
    >
  | WidgetBase<
      "alert",
      {
        severity: "info" | "success" | "warning" | "danger";
        heading: string;
        body?: string;
        action?: { label: string; href?: string; prompt?: string };
        dismissible?: boolean;
      }
    >
  | WidgetBase<
      "breadcrumb",
      { items: { label: string; href?: string }[] }
    >
  | WidgetBase<
      "multi-choice",
      {
        question?: string;
        items: { label: string; prompt: string; description?: string }[];
      }
    >
  | WidgetBase<
      "before-after",
      {
        before: { src: string; alt: string };
        after: { src: string; alt: string };
        beforeLabel?: string;
        afterLabel?: string;
        initial?: number;
      }
    >
  | WidgetBase<
      "document",
      {
        filename: string;
        href: string;
        bytes?: number;
        format?: string;
        description?: string;
      }
    >;

export interface ChatMessageRef {
  role: "user" | "assistant";
  content: string;
}

export interface PageContext {
  /** Pathname like /pricing */
  path?: string;
  /** Document title */
  title?: string;
  /** Page summary collected from `<h1>`/`<h2>` + meta description */
  summary?: string;
  /** First N visible headings, for grounded suggestions */
  headings?: string[];
  /** Optional selection (≤2000 chars) */
  selection?: string;
}

export interface ChatRequest {
  messages: ChatMessageRef[];
  thread?: string;
  /** What route + headings + selection the user is currently looking at. */
  pageContext?: PageContext;
  /** Editor document (HTML + title) — kept for backwards compat with /editor. */
  documentContext?: { title?: string; html?: string };
}

/**
 * Structured response shape — the assistant streams a final `widgets` event
 * after text deltas finish. Clients fall back gracefully when widgets are
 * absent (pure-text answers).
 */
export interface ChatResponse {
  /** Plain markdown for the bubble — the same text streamed via `token`. */
  text: string;
  /** Rich widgets rendered after the text. */
  widgets?: Widget[];
  /** Follow-up prompts to surface as chips. */
  suggestions?: string[];
  /** Citations / source links shown in a Sources widget. */
  sources?: { label: string; href: string; description?: string }[];
  /** Server-recognized commands the client should run after rendering. */
  commands?: { name: string; args?: Record<string, unknown> }[];
  /** Free-form metadata (latency, model, tokens, requestId). */
  metadata?: Record<string, unknown>;
}

/**
 * SSE event names emitted by `/api/assistant/chat`.
 *
 * - `token`   — `{ text: string }` text delta
 * - `widget`  — `Widget` single rich payload (may fire 0-N times)
 * - `done`    — `{ requestId, durationMs, inputTokens, outputTokens, limit, remaining, suggestions?, sources?, commands? }`
 * - `error`   — `{ message: string, code?: string }`
 */
export type SseEventName = "token" | "widget" | "done" | "error";
