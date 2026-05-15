/**
 * Widget registry — renders every kind from `src/shared/ai-chat.ts`.
 *
 * Adding a new widget kind:
 *   1. Add the variant to `Widget` in `src/shared/ai-chat.ts`.
 *   2. Add a `case` to the `WidgetView` switch below and a small render
 *      component above it.
 *   3. Cover the renderer in `widgets.test.tsx` (smoke render or DOM check).
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Sparkles,
  Code,
  Compass,
  LifeBuoy,
  Check,
  Info,
  AlertTriangle,
  ArrowRight,
  X,
  Quote as QuoteIcon,
  ChevronRight,
  Link2,
  ExternalLink,
  Star,
  Search as SearchIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Wrench,
  FileText,
  Download,
  Home as HomeIcon,
} from "lucide-react";
import type { Widget, CalloutTone } from "../../../shared/ai-chat";
import { escapeHtml, isSafeUrl, renderMarkdown } from "./markdown";

interface RunSlashFn {
  (command: string): void;
}

const ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  code: Code,
  compass: Compass,
  lifebuoy: LifeBuoy,
  check: Check,
  info: Info,
  warn: AlertTriangle,
};

function getIcon(name?: string): typeof Sparkles | null {
  if (!name) return null;
  return ICONS[name] ?? null;
}

/** Top-level renderer used by the message bubble. */
export function WidgetList({
  widgets,
  onPrompt,
  onRunCommand,
}: {
  widgets: Widget[];
  onPrompt: (prompt: string) => void;
  onRunCommand: RunSlashFn;
}) {
  if (!widgets.length) return null;
  return (
    <div className="mt-3 space-y-3">
      {widgets.map((w, i) => (
        <WidgetView key={w.id ?? `${w.kind}-${i}`} widget={w} onPrompt={onPrompt} onRunCommand={onRunCommand} />
      ))}
    </div>
  );
}

function WidgetView({
  widget,
  onPrompt,
  onRunCommand,
}: {
  widget: Widget;
  onPrompt: (prompt: string) => void;
  onRunCommand: RunSlashFn;
}) {
  const { title, caption } = widget;

  const body = (() => {
    switch (widget.kind) {
      case "text":
        return <p className="text-sm leading-relaxed">{widget.payload.text}</p>;

      case "markdown":
        return (
          <div
            className="assist-md text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(widget.payload.markdown) }}
          />
        );

      case "callout":
        return <CalloutView tone={widget.payload.tone} markdown={widget.payload.markdown} />;

      case "cta":
        return (
          <CtaView
            label={widget.payload.label}
            href={widget.payload.href}
            variant={widget.payload.variant}
            external={widget.payload.external}
            prompt={widget.payload.prompt}
            onPrompt={onPrompt}
          />
        );

      case "link-list":
        return <LinkListView items={widget.payload.items} />;

      case "card":
        return <CardView {...widget.payload} />;

      case "card-grid":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {widget.payload.items.map((it, i) => (
              <CardView key={i} {...it} />
            ))}
          </div>
        );

      case "pricing":
        return <PricingView plans={widget.payload.plans} />;

      case "feature-grid":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {widget.payload.items.map((it, i) => {
              const Icon = getIcon(it.icon);
              return (
                <div key={i} className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    {Icon ? <Icon size={14} className="text-[var(--color-cyan)]" aria-hidden="true" /> : null}
                    <span className="text-sm font-semibold">{it.heading}</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">{it.body}</p>
                </div>
              );
            })}
          </div>
        );

      case "faq":
        return <FaqView items={widget.payload.items} />;

      case "table":
        return <TableView columns={widget.payload.columns} rows={widget.payload.rows} emphasis={widget.payload.emphasis} />;

      case "code":
        return <CodeView language={widget.payload.language} code={widget.payload.code} filename={widget.payload.filename} />;

      case "stat-grid":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {widget.payload.items.map((s, i) => (
              <div key={i} className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
                <div className="text-2xl font-bold text-[var(--color-cyan)] leading-none">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-1">{s.label}</div>
                {s.sub ? <div className="text-xs mt-1 text-[var(--color-fg)]/80">{s.sub}</div> : null}
              </div>
            ))}
          </div>
        );

      case "checklist":
        return (
          <ul className="space-y-1.5">
            {widget.payload.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className={
                    "mt-1 inline-flex w-4 h-4 shrink-0 items-center justify-center rounded border " +
                    (it.done
                      ? "bg-[var(--color-cyan)] border-[var(--color-cyan)] text-[#060610]"
                      : "border-[var(--color-line)]")
                  }
                >
                  {it.done ? <Check size={10} aria-hidden="true" /> : null}
                </span>
                <span className={it.done ? "line-through text-[var(--color-muted)]" : ""}>
                  {it.label}
                  {it.note ? <span className="ml-1 text-[var(--color-muted)]"> — {it.note}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        );

      case "steps":
        return (
          <ol className="space-y-2">
            {widget.payload.items.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 mt-0.5 w-6 h-6 grid place-items-center rounded-full bg-[var(--color-cyan)] text-[#060610] text-xs font-bold">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  {s.body ? <p className="text-xs text-[var(--color-muted)] leading-relaxed mt-0.5">{s.body}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        );

      case "photo":
        return (
          <PhotoView
            src={widget.payload.src}
            alt={widget.payload.alt}
            credit={widget.payload.credit}
            href={widget.payload.href}
          />
        );

      case "gallery":
        return <GalleryView items={widget.payload.items} layout={widget.payload.layout} />;

      case "video":
        return <VideoView src={widget.payload.src} poster={widget.payload.poster} provider={widget.payload.provider} title={widget.payload.title} />;

      case "quote":
        return <QuoteView text={widget.payload.text} cite={widget.payload.cite} role={widget.payload.role} avatar={widget.payload.avatar} />;

      case "person":
        return <PersonView {...widget.payload} />;

      case "sources":
        return <SourcesView items={widget.payload.items} />;

      case "suggestions":
        return <SuggestionsView items={widget.payload.items} onPrompt={onPrompt} onRunCommand={onRunCommand} />;

      case "shortcommands":
        return <ShortCommandsView items={widget.payload.items} onRunCommand={onRunCommand} />;

      case "chart":
        return (
          <ChartView
            items={widget.payload.items}
            unit={widget.payload.unit}
            max={widget.payload.max}
          />
        );

      case "timeline":
        return <TimelineView items={widget.payload.items} />;

      case "rating":
        return (
          <RatingView
            value={widget.payload.value}
            max={widget.payload.max}
            label={widget.payload.label}
            reviews={widget.payload.reviews}
          />
        );

      case "status":
        return (
          <StatusView
            overall={widget.payload.overall}
            items={widget.payload.items}
            href={widget.payload.href}
          />
        );

      case "form":
        return (
          <FormView
            fields={widget.payload.fields}
            action={widget.payload.action}
            submitLabel={widget.payload.submitLabel}
          />
        );

      case "search-results":
        return (
          <SearchResultsView
            items={widget.payload.items}
            query={widget.payload.query}
          />
        );

      case "alert":
        return (
          <AlertView
            severity={widget.payload.severity}
            heading={widget.payload.heading}
            body={widget.payload.body}
            action={widget.payload.action}
            dismissible={widget.payload.dismissible}
            onPrompt={onPrompt}
          />
        );

      case "breadcrumb":
        return <BreadcrumbView items={widget.payload.items} />;

      case "multi-choice":
        return (
          <MultiChoiceView
            question={widget.payload.question}
            items={widget.payload.items}
            onPrompt={onPrompt}
          />
        );

      case "before-after":
        return (
          <BeforeAfterView
            before={widget.payload.before}
            after={widget.payload.after}
            beforeLabel={widget.payload.beforeLabel}
            afterLabel={widget.payload.afterLabel}
            initial={widget.payload.initial}
          />
        );

      case "document":
        return (
          <DocumentView
            filename={widget.payload.filename}
            href={widget.payload.href}
            bytes={widget.payload.bytes}
            format={widget.payload.format}
            description={widget.payload.description}
          />
        );
    }
  })();

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-3">
      {title ? <div className="text-xs font-semibold mb-2 text-[var(--color-fg)]">{title}</div> : null}
      {body}
      {caption ? <div className="text-[10px] text-[var(--color-muted)] mt-2">{caption}</div> : null}
    </div>
  );
}

// ── Callout ────────────────────────────────────────────────────────────
function CalloutView({ tone, markdown }: { tone: CalloutTone; markdown: string }) {
  const toneClass: Record<CalloutTone, string> = {
    info: "bg-cyan-500/10 border-cyan-500/30 text-cyan-200",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    danger: "bg-red-500/10 border-red-500/30 text-red-200",
    tip: "bg-violet-500/10 border-violet-500/30 text-violet-200",
  };
  return (
    <div className={`rounded-md border px-3 py-2 text-xs leading-relaxed ${toneClass[tone]}`}>
      <div className="assist-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
    </div>
  );
}

// ── CTA ────────────────────────────────────────────────────────────────
function CtaView({
  label,
  href,
  external,
  variant = "primary",
  prompt,
  onPrompt,
}: {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  prompt?: string;
  onPrompt: (prompt: string) => void;
}) {
  if (prompt) {
    return (
      <button
        type="button"
        onClick={() => onPrompt(prompt)}
        className={"inline-flex items-center gap-1 px-3 h-9 rounded-md text-sm font-semibold " + ctaClass(variant)}
      >
        {label}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    );
  }
  const safeHref = isSafeUrl(href) || href.startsWith("/") || href.startsWith("mailto:") ? href : "/";
  return (
    <a
      href={safeHref}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={"inline-flex items-center gap-1 px-3 h-9 rounded-md text-sm font-semibold " + ctaClass(variant)}
    >
      {label}
      {external ? <ExternalLink size={12} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
    </a>
  );
}
function ctaClass(v: "primary" | "secondary" | "ghost"): string {
  if (v === "primary") return "bg-[var(--color-cyan)] text-[#060610] hover:bg-[var(--color-blue)]";
  if (v === "secondary") return "bg-white/[0.06] text-[var(--color-fg)] hover:bg-white/[0.12] border border-[var(--color-line)]";
  return "text-[var(--color-fg)] hover:bg-white/[0.04]";
}

// ── Link list ──────────────────────────────────────────────────────────
function LinkListView({ items }: { items: { label: string; href: string; description?: string; external?: boolean }[] }) {
  return (
    <ul className="space-y-1">
      {items.map((it, i) => {
        const safe = isSafeUrl(it.href) || it.href.startsWith("/") || it.href.startsWith("mailto:");
        const href = safe ? it.href : "#";
        return (
          <li key={i}>
            <a
              href={href}
              target={it.external ? "_blank" : undefined}
              rel={it.external ? "noopener noreferrer" : undefined}
              className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04]"
            >
              <Link2 size={12} className="mt-1 text-[var(--color-muted)] group-hover:text-[var(--color-cyan)]" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{it.label}</div>
                {it.description ? <div className="text-[10px] text-[var(--color-muted)]">{it.description}</div> : null}
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

// ── Card ───────────────────────────────────────────────────────────────
function CardView({
  eyebrow,
  heading,
  body,
  href,
  image,
}: {
  eyebrow?: string;
  heading: string;
  body: string;
  href?: string;
  image?: string;
}) {
  const inner = (
    <>
      {image ? <img src={image} alt="" className="w-full h-32 object-cover rounded-md mb-2" loading="lazy" /> : null}
      {eyebrow ? <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-0.5">{eyebrow}</div> : null}
      <div className="text-sm font-semibold">{heading}</div>
      <p className="text-xs text-[var(--color-muted)] leading-relaxed mt-1">{body}</p>
    </>
  );
  if (href && (isSafeUrl(href) || href.startsWith("/"))) {
    return (
      <a href={href} className="block rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3 hover:border-[var(--color-cyan)]">
        {inner}
      </a>
    );
  }
  return <div className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">{inner}</div>;
}

// ── Pricing ────────────────────────────────────────────────────────────
function PricingView({
  plans,
}: {
  plans: { name: string; price: string; period?: string; features: string[]; ctaLabel: string; ctaHref: string; highlight?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {plans.map((p, i) => (
        <div
          key={i}
          className={
            "rounded-lg border p-3 " +
            (p.highlight
              ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/5"
              : "border-[var(--color-line)] bg-white/[0.02]")
          }
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{p.name}</div>
          <div className="mt-1">
            <span className="text-2xl font-bold">{p.price}</span>
            {p.period ? <span className="text-xs text-[var(--color-muted)] ml-0.5">{p.period}</span> : null}
          </div>
          <ul className="mt-2 space-y-1">
            {p.features.map((f, j) => (
              <li key={j} className="flex items-start gap-1.5 text-xs">
                <Check size={11} className="mt-0.5 text-[var(--color-cyan)] shrink-0" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <a
            href={isSafeUrl(p.ctaHref) || p.ctaHref.startsWith("/") ? p.ctaHref : "/"}
            className={
              "mt-3 block text-center px-3 h-8 leading-8 rounded-md text-xs font-semibold " +
              (p.highlight
                ? "bg-[var(--color-cyan)] text-[#060610] hover:bg-[var(--color-blue)]"
                : "bg-white/[0.06] text-[var(--color-fg)] hover:bg-white/[0.12]")
            }
          >
            {p.ctaLabel}
          </a>
        </div>
      ))}
    </div>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────
function FaqView({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-1">
      {items.map((it, i) => (
        <details key={i} className="group rounded-md border border-[var(--color-line)] bg-white/[0.02] open:bg-white/[0.04]">
          <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer list-none text-sm font-semibold">
            <ChevronRight size={14} className="transition-transform group-open:rotate-90 text-[var(--color-muted)]" aria-hidden="true" />
            <span>{it.q}</span>
          </summary>
          <div className="px-3 pb-2.5 pt-1 text-xs text-[var(--color-muted)] leading-relaxed">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────────────
function TableView({
  columns,
  rows,
  emphasis,
}: {
  columns: string[];
  rows: string[][];
  emphasis?: number[];
}) {
  const empSet = new Set(emphasis ?? []);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                scope="col"
                className="text-left font-semibold border-b border-[var(--color-line)] px-2 py-1.5 text-[var(--color-fg)]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={empSet.has(i) ? "bg-[var(--color-cyan)]/5" : ""}>
              {r.map((cell, j) => (
                <td key={j} className="border-b border-[var(--color-line)] px-2 py-1.5 text-[var(--color-fg)]/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Code ───────────────────────────────────────────────────────────────
function CodeView({ language, code, filename }: { language?: string; code: string; filename?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);
  return (
    <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-[var(--color-line)] text-[10px] text-[var(--color-muted)] font-mono">
        <span>
          {filename ? `${filename} · ` : ""}
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="inline-flex items-center gap-1 text-[10px] hover:text-[var(--color-cyan)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-2.5 py-2 text-xs font-mono whitespace-pre">
        <code dangerouslySetInnerHTML={{ __html: escapeHtml(code) }} />
      </pre>
    </div>
  );
}

// ── Photo ──────────────────────────────────────────────────────────────
function PhotoView({ src, alt, credit, href }: { src: string; alt: string; credit?: string; href?: string }) {
  const [open, setOpen] = useState(false);
  const img = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full max-h-[420px] object-cover rounded-md cursor-zoom-in"
      onClick={() => setOpen(true)}
    />
  );
  return (
    <>
      {href && (isSafeUrl(href) || href.startsWith("/")) ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
      {credit ? <div className="text-[10px] text-[var(--color-muted)] mt-1">{credit}</div> : null}
      {open ? <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────
function GalleryView({
  items,
  layout = "grid",
}: {
  items: { src: string; alt: string; credit?: string; href?: string }[];
  layout?: "grid" | "carousel";
}) {
  const [active, setActive] = useState<number | null>(null);
  if (layout === "carousel") {
    return (
      <>
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className="snap-start shrink-0 w-44 rounded-md overflow-hidden border border-[var(--color-line)] hover:border-[var(--color-cyan)]"
            >
              <img src={it.src} alt={it.alt} loading="lazy" className="w-44 h-28 object-cover" />
            </button>
          ))}
        </div>
        {active !== null && items[active] ? (
          <Lightbox src={items[active].src} alt={items[active].alt} onClose={() => setActive(null)} />
        ) : null}
      </>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {items.map((it, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className="aspect-square rounded-md overflow-hidden border border-[var(--color-line)] hover:border-[var(--color-cyan)]"
          >
            <img src={it.src} alt={it.alt} loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {active !== null && items[active] ? (
        <Lightbox src={items[active].src} alt={items[active].alt} onClose={() => setActive(null)} />
      ) : null}
    </>
  );
}

// ── Lightbox ───────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[60] bg-black/85 grid place-items-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X size={16} aria-hidden="true" />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-full object-contain rounded-md" />
    </div>
  );
}

// ── Video ──────────────────────────────────────────────────────────────
function VideoView({
  src,
  poster,
  provider,
  title,
}: {
  src: string;
  poster?: string;
  provider?: "mp4" | "youtube" | "vimeo";
  title?: string;
}) {
  if (!isSafeUrl(src) && !src.startsWith("/")) {
    return <div className="text-xs text-[var(--color-muted)]">[unsupported video URL]</div>;
  }
  if (provider === "youtube" || provider === "vimeo") {
    return (
      <iframe
        src={src}
        title={title || "Video"}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full aspect-video rounded-md border border-[var(--color-line)]"
      />
    );
  }
  return (
    <video
      controls
      preload="metadata"
      poster={poster}
      src={src}
      className="w-full aspect-video rounded-md border border-[var(--color-line)]"
    />
  );
}

// ── Quote ──────────────────────────────────────────────────────────────
function QuoteView({ text, cite, role, avatar }: { text: string; cite?: string; role?: string; avatar?: string }) {
  return (
    <blockquote className="flex gap-3">
      <QuoteIcon size={16} className="shrink-0 mt-0.5 text-[var(--color-cyan)]" aria-hidden="true" />
      <div>
        <p className="text-sm italic text-[var(--color-fg)] leading-relaxed">{text}</p>
        {cite ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            {avatar ? <img src={avatar} alt="" className="w-6 h-6 rounded-full" /> : null}
            <span>
              <strong className="text-[var(--color-fg)]">{cite}</strong>
              {role ? ` · ${role}` : ""}
            </span>
          </div>
        ) : null}
      </div>
    </blockquote>
  );
}

// ── Person ─────────────────────────────────────────────────────────────
function PersonView({
  name,
  role,
  bio,
  avatar,
  href,
}: {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3">
      {avatar ? (
        <img src={avatar} alt="" loading="lazy" className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-[var(--color-cyan)]/20 grid place-items-center font-bold text-[var(--color-cyan)]">
          {name.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm font-semibold">{name}</div>
        {role ? <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{role}</div> : null}
        {bio ? <p className="text-xs text-[var(--color-muted)] leading-relaxed mt-1">{bio}</p> : null}
      </div>
    </div>
  );
  if (href && (isSafeUrl(href) || href.startsWith("/"))) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90">
        {inner}
      </a>
    );
  }
  return inner;
}

// ── Sources ────────────────────────────────────────────────────────────
function SourcesView({ items }: { items: { label: string; href: string; description?: string; favicon?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => {
        const safe = isSafeUrl(s.href) || s.href.startsWith("/");
        return (
          <a
            key={i}
            href={safe ? s.href : "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={s.description || s.label}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] border border-[var(--color-line)] hover:border-[var(--color-cyan)] text-[10px]"
          >
            {s.favicon ? <img src={s.favicon} alt="" className="w-3 h-3 rounded" /> : <Link2 size={10} aria-hidden="true" />}
            <span className="truncate max-w-[140px]">{s.label}</span>
          </a>
        );
      })}
    </div>
  );
}

// ── Suggestions ────────────────────────────────────────────────────────
function SuggestionsView({
  items,
  onPrompt,
  onRunCommand,
}: {
  items: { label: string; prompt: string }[];
  onPrompt: (prompt: string) => void;
  onRunCommand: RunSlashFn;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => (s.prompt.startsWith("/") ? onRunCommand(s.prompt) : onPrompt(s.prompt))}
          className="px-2.5 h-7 rounded-full bg-white/[0.04] border border-[var(--color-line)] hover:border-[var(--color-cyan)] hover:bg-white/[0.08] text-[11px]"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ── Chart ──────────────────────────────────────────────────────────────
function ChartView({
  items,
  unit,
  max,
}: {
  items: { label: string; value: number; sub?: string; highlight?: boolean }[];
  unit?: string;
  max?: number;
}) {
  const ceiling = (max ?? items.reduce((m, it) => Math.max(m, it.value), 0)) || 1;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => {
        const pct = Math.min(100, Math.max(2, Math.round((it.value / ceiling) * 100)));
        return (
          <li key={i}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-[var(--color-fg)] truncate">{it.label}</span>
              <span className="font-semibold tabular-nums">
                {it.value.toLocaleString()}
                {unit ? <span className="text-[var(--color-muted)] ml-0.5">{unit}</span> : null}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={
                  "h-full rounded-full " +
                  (it.highlight ? "bg-[var(--color-cyan)]" : "bg-[var(--color-blue)]/70")
                }
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            </div>
            {it.sub ? <div className="text-[10px] text-[var(--color-muted)] mt-0.5">{it.sub}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}

// ── Timeline ───────────────────────────────────────────────────────────
function TimelineView({
  items,
}: {
  items: { when: string; title: string; body?: string; tag?: string; href?: string }[];
}) {
  return (
    <ol className="relative border-l border-[var(--color-line)] ml-1.5 space-y-3 pl-3">
      {items.map((it, i) => {
        const safe = it.href && (isSafeUrl(it.href) || it.href.startsWith("/"));
        const heading = safe ? (
          <a href={it.href} className="text-sm font-semibold hover:text-[var(--color-cyan)]">
            {it.title}
          </a>
        ) : (
          <span className="text-sm font-semibold">{it.title}</span>
        );
        return (
          <li key={i} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-cyan)] ring-2 ring-[var(--color-bg,#060610)]"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
                {it.when}
              </span>
              {it.tag ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-[var(--color-line)] text-[var(--color-fg)]/80">
                  {it.tag}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5">{heading}</div>
            {it.body ? (
              <p className="text-xs text-[var(--color-muted)] leading-relaxed mt-1">{it.body}</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

// ── Rating ─────────────────────────────────────────────────────────────
function RatingView({
  value,
  max = 5,
  label,
  reviews,
}: {
  value: number;
  max?: number;
  label?: string;
  reviews?: number;
}) {
  const clamped = Math.max(0, Math.min(max, value));
  const full = Math.floor(clamped);
  const fraction = clamped - full;
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${clamped.toFixed(1)} out of ${max} stars${reviews ? `, ${reviews} reviews` : ""}`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => {
          const fill = i < full ? 1 : i === full ? fraction : 0;
          return (
            <span key={i} className="relative inline-flex w-3.5 h-3.5">
              <Star size={14} className="absolute inset-0 text-[var(--color-line)]" aria-hidden="true" />
              {fill > 0 ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                  aria-hidden="true"
                >
                  <Star size={14} className="text-[var(--color-cyan)] fill-[var(--color-cyan)]" />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      <span className="text-sm font-semibold tabular-nums">{clamped.toFixed(1)}</span>
      {label ? <span className="text-xs text-[var(--color-muted)]">· {label}</span> : null}
      {reviews ? <span className="text-xs text-[var(--color-muted)]">· {reviews.toLocaleString()} reviews</span> : null}
    </div>
  );
}

// ── Status ─────────────────────────────────────────────────────────────
type StatusKind = "operational" | "degraded" | "outage" | "maintenance";
const STATUS_META: Record<StatusKind, { label: string; tone: string; Icon: typeof CheckCircle2 }> = {
  operational: { label: "All systems operational", tone: "text-emerald-300", Icon: CheckCircle2 },
  degraded: { label: "Degraded performance", tone: "text-amber-300", Icon: AlertCircle },
  outage: { label: "Major outage", tone: "text-red-300", Icon: XCircle },
  maintenance: { label: "Scheduled maintenance", tone: "text-cyan-300", Icon: Wrench },
};

function StatusView({
  overall,
  items,
  href,
}: {
  overall: StatusKind;
  items?: { label: string; status: StatusKind; note?: string }[];
  href?: string;
}) {
  const meta = STATUS_META[overall];
  const Icon = meta.Icon;
  const safeHref = href && (isSafeUrl(href) || href.startsWith("/")) ? href : undefined;
  return (
    <div>
      <div className={"flex items-center gap-2 text-sm font-semibold " + meta.tone}>
        <Icon size={16} aria-hidden="true" />
        <span>{meta.label}</span>
        {safeHref ? (
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-[10px] uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-cyan)]"
          >
            Status page
          </a>
        ) : null}
      </div>
      {items?.length ? (
        <ul className="mt-2 space-y-1">
          {items.map((it, i) => {
            const sub = STATUS_META[it.status];
            const SubIcon = sub.Icon;
            return (
              <li key={i} className="flex items-center gap-2 text-xs">
                <SubIcon size={12} className={sub.tone} aria-hidden="true" />
                <span className="text-[var(--color-fg)]">{it.label}</span>
                {it.note ? <span className="text-[var(--color-muted)]"> — {it.note}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// ── Form ───────────────────────────────────────────────────────────────
function FormView({
  fields,
  action,
  submitLabel = "Send",
}: {
  fields: { name: string; label: string; type?: "text" | "email" | "textarea" | "url"; placeholder?: string; required?: boolean }[];
  action?: string;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const safeAction = action && (isSafeUrl(action) || action.startsWith("/")) ? action : null;

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!safeAction) {
        setSent(true);
        return;
      }
      setBusy(true);
      try {
        await fetch(safeAction, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        setSent(true);
      } catch {
        setSent(true);
      } finally {
        setBusy(false);
      }
    },
    [safeAction, values]
  );

  if (sent) {
    return (
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
        Thanks — message received. We'll get back to you shortly.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {fields.map((f) => {
        const id = `aichat-form-${f.name}`;
        const v = values[f.name] ?? "";
        const onChange = (val: string) => setValues((s) => ({ ...s, [f.name]: val }));
        return (
          <div key={f.name}>
            <label htmlFor={id} className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-0.5">
              {f.label}
              {f.required ? <span className="text-red-400 ml-1">*</span> : null}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={id}
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                value={v}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-[var(--color-line)] bg-white/[0.02] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[var(--color-cyan)]"
              />
            ) : (
              <input
                id={id}
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                value={v}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border border-[var(--color-line)] bg-white/[0.02] px-2.5 h-9 text-sm focus:outline-none focus:border-[var(--color-cyan)]"
              />
            )}
          </div>
        );
      })}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1 px-3 h-9 rounded-md text-sm font-semibold bg-[var(--color-cyan)] text-[#060610] hover:bg-[var(--color-blue)] disabled:opacity-60"
      >
        {busy ? "Sending…" : submitLabel}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </form>
  );
}

// ── Search results ─────────────────────────────────────────────────────
function SearchResultsView({
  items,
  query,
}: {
  items: { title: string; href: string; snippet?: string; eyebrow?: string; score?: number }[];
  query?: string;
}) {
  if (!items.length) {
    return (
      <div className="flex items-start gap-2 text-xs text-[var(--color-muted)]">
        <SearchIcon size={12} aria-hidden="true" className="mt-0.5" />
        <span>No results{query ? ` for "${query}"` : ""}.</span>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((it, i) => {
        const safe = isSafeUrl(it.href) || it.href.startsWith("/");
        const href = safe ? it.href : "#";
        return (
          <li key={i}>
            <a
              href={href}
              className="group block rounded-md hover:bg-white/[0.03] px-2 py-1.5 -mx-2"
            >
              <div className="flex items-baseline gap-2">
                {it.eyebrow ? (
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] shrink-0">
                    {it.eyebrow}
                  </span>
                ) : null}
                <span className="text-sm font-semibold group-hover:text-[var(--color-cyan)] truncate">
                  {it.title}
                </span>
                {typeof it.score === "number" ? (
                  <span className="text-[10px] text-[var(--color-muted)] ml-auto shrink-0 tabular-nums">
                    {Math.round(it.score * 100)}%
                  </span>
                ) : null}
              </div>
              {it.snippet ? (
                <p className="text-xs text-[var(--color-muted)] leading-relaxed mt-0.5">{it.snippet}</p>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

// ── Shortcommands ──────────────────────────────────────────────────────
function ShortCommandsView({
  items,
  onRunCommand,
}: {
  items: { command: string; description: string; group?: string }[];
  onRunCommand: RunSlashFn;
}) {
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const g = it.group || "Other";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(it);
  }
  return (
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([g, list]) => (
        <div key={g}>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-1">{g}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {list.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onRunCommand(c.command)}
                className="text-left px-2 py-1.5 rounded-md hover:bg-white/[0.04] flex items-baseline gap-2"
              >
                <span className="font-mono text-[11px] text-[var(--color-cyan)] shrink-0">{c.command}</span>
                <span className="text-[10px] text-[var(--color-muted)] truncate">{c.description}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Alert ──────────────────────────────────────────────────────────────
function AlertView({
  severity,
  heading,
  body,
  action,
  dismissible,
  onPrompt,
}: {
  severity: "info" | "success" | "warning" | "danger";
  heading: string;
  body?: string;
  action?: { label: string; href?: string; prompt?: string };
  dismissible?: boolean;
  onPrompt: (prompt: string) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const sev: Record<typeof severity, { cls: string; Icon: typeof Info }> = {
    info: { cls: "bg-cyan-500/10 border-cyan-500/30 text-cyan-200", Icon: Info },
    success: { cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200", Icon: CheckCircle2 },
    warning: { cls: "bg-amber-500/10 border-amber-500/30 text-amber-200", Icon: AlertTriangle },
    danger: { cls: "bg-red-500/10 border-red-500/30 text-red-200", Icon: AlertCircle },
  };
  const { cls, Icon } = sev[severity];
  return (
    <div role="alert" className={"rounded-md border px-3 py-2 text-xs leading-relaxed flex items-start gap-2 " + cls}>
      <Icon size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{heading}</div>
        {body ? <div className="opacity-90 mt-0.5">{body}</div> : null}
        {action ? (
          <div className="mt-2">
            {action.prompt ? (
              <button
                type="button"
                onClick={() => onPrompt(action.prompt!)}
                className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12]"
              >
                {action.label}
                <ArrowRight size={11} aria-hidden="true" />
              </button>
            ) : action.href ? (
              <a
                href={isSafeUrl(action.href) || action.href.startsWith("/") || action.href.startsWith("mailto:") ? action.href : "#"}
                className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12]"
              >
                {action.label}
                <ArrowRight size={11} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={() => setDismissed(true)}
          className="shrink-0 opacity-70 hover:opacity-100 -mr-1 -mt-0.5 p-1 rounded"
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

// ── Breadcrumb ─────────────────────────────────────────────────────────
function BreadcrumbView({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs">
      <ol className="flex items-center flex-wrap gap-x-1.5 gap-y-1">
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          const safe = it.href && (isSafeUrl(it.href) || it.href.startsWith("/"));
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i === 0 ? <HomeIcon size={11} aria-hidden="true" className="opacity-70" /> : null}
              {safe && !isLast ? (
                <a href={it.href} className="text-[var(--color-cyan)] hover:underline">
                  {it.label}
                </a>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "font-semibold" : "text-[var(--color-muted)]"}>
                  {it.label}
                </span>
              )}
              {!isLast ? <ChevronRight size={11} aria-hidden="true" className="text-[var(--color-muted)]" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Multi-choice ───────────────────────────────────────────────────────
function MultiChoiceView({
  question,
  items,
  onPrompt,
}: {
  question?: string;
  items: { label: string; prompt: string; description?: string }[];
  onPrompt: (prompt: string) => void;
}) {
  return (
    <div className="space-y-2">
      {question ? <div className="text-sm font-semibold">{question}</div> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {items.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPrompt(c.prompt)}
            className="text-left rounded-md border border-[var(--color-line)] bg-white/[0.02] hover:bg-white/[0.05] px-3 py-2 transition-colors"
          >
            <div className="text-sm font-semibold">{c.label}</div>
            {c.description ? <div className="text-xs text-[var(--color-muted)] mt-0.5">{c.description}</div> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Before / After ─────────────────────────────────────────────────────
function BeforeAfterView({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  initial = 50,
}: {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  beforeLabel?: string;
  afterLabel?: string;
  initial?: number;
}) {
  const [pos, setPos] = useState(Math.max(0, Math.min(100, initial)));
  const beforeSafe = isSafeUrl(before.src) || before.src.startsWith("/");
  const afterSafe = isSafeUrl(after.src) || after.src.startsWith("/");
  if (!beforeSafe || !afterSafe) {
    return (
      <p className="text-xs text-[var(--color-muted)]">
        {beforeLabel}: {before.alt} → {afterLabel}: {after.alt}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border border-[var(--color-line)] aspect-[16/10] bg-black/30">
        <img
          src={after.src}
          alt={after.alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          aria-hidden="true"
        >
          <img
            src={before.src}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--color-cyan)] pointer-events-none"
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        />
        <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded">
          {beforeLabel}
        </span>
        <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded">
          {afterLabel}
        </span>
      </div>
      <label className="block">
        <span className="sr-only">Compare {beforeLabel} and {afterLabel}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="w-full accent-[var(--color-cyan)]"
          aria-label={`Reveal ${afterLabel} — current ${pos}%`}
        />
      </label>
    </div>
  );
}

// ── Document ───────────────────────────────────────────────────────────
function DocumentView({
  filename,
  href,
  bytes,
  format,
  description,
}: {
  filename: string;
  href: string;
  bytes?: number;
  format?: string;
  description?: string;
}) {
  const safe = isSafeUrl(href) || href.startsWith("/");
  const sizeLabel = bytes ? formatBytes(bytes) : null;
  const fmt = (format ?? filename.split(".").pop() ?? "FILE").toUpperCase();
  const content = (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-10 h-12 rounded border border-[var(--color-line)] bg-white/[0.04] grid place-items-center">
        <FileText size={16} className="text-[var(--color-cyan)]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{filename}</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5">
          {fmt}
          {sizeLabel ? ` · ${sizeLabel}` : ""}
        </div>
        {description ? <div className="text-xs text-[var(--color-muted)] mt-1 line-clamp-2">{description}</div> : null}
      </div>
      <Download size={14} className="shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
    </div>
  );
  if (!safe) {
    return <div className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] px-3 py-3">{content}</div>;
  }
  return (
    <a
      href={href}
      download={filename}
      className="block rounded-lg border border-[var(--color-line)] bg-white/[0.02] hover:bg-white/[0.05] px-3 py-3 transition-colors"
    >
      {content}
    </a>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
