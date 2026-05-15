/**
 * Slash command registry.
 *
 * Each command is one of:
 *   - "ui"     — the client handles it locally (open thread, clear, export, etc.)
 *   - "nav"    — the client navigates to a route (`/pricing`, `/explore`, …)
 *   - "widget" — the client renders a pre-canned widget set without calling the model
 *   - "prompt" — the client transforms the input into a richer prompt and sends it to the AI
 *
 * Adding a new command:
 *   1. Append an entry below with `name`, `group`, `description`, `kind`.
 *   2. If `kind: "widget"`, push a `getWidgets()` factory that returns a Widget[].
 *   3. If `kind: "prompt"`, push a `getPrompt()` that returns a string the AI sees.
 *   4. Re-run unit tests: `npm test -- ai-chat/commands`.
 */

import type { Widget } from "../../../shared/ai-chat";

export type CommandGroup =
  | "Help"
  | "Navigation"
  | "Sales"
  | "Account"
  | "Content"
  | "Editor"
  | "Tools"
  | "Support";

export type CommandKind = "ui" | "nav" | "widget" | "prompt";

interface BaseCommand {
  name: string; // e.g. "/help"
  description: string;
  group: CommandGroup;
  aliases?: string[];
}

export interface UiCommand extends BaseCommand {
  kind: "ui";
  action:
    | "new"
    | "clear"
    | "export"
    | "copyLast"
    | "stop"
    | "regenerate"
    | "settings"
    | "feedback"
    | "share";
}

export interface NavCommand extends BaseCommand {
  kind: "nav";
  href: string;
}

export interface WidgetCommand extends BaseCommand {
  kind: "widget";
  /** Optional intro text rendered above the widgets. */
  intro?: string;
  getWidgets: () => Widget[];
}

export interface PromptCommand extends BaseCommand {
  kind: "prompt";
  getPrompt: (args: string) => string;
}

export type Command = UiCommand | NavCommand | WidgetCommand | PromptCommand;

export const COMMANDS: Command[] = [
  // ── Help ────────────────────────────────────────────────────────────
  {
    name: "/help",
    description: "Show what the assistant can do",
    group: "Help",
    kind: "widget",
    intro: "Here's what I can help with. Type `/shortcommands` to see every command.",
    getWidgets: () => [
      {
        kind: "feature-grid",
        title: "What I can do",
        payload: {
          items: [
            { icon: "sparkles", heading: "Draft documents", body: "Invoices, resumes, proposals, contracts, reports — describe it in plain English." },
            { icon: "code", heading: "Edit your HTML/CSS", body: "Share your document and I'll suggest precise changes." },
            { icon: "lifebuoy", heading: "Answer pricing + features", body: "Plans, limits, refund policy, billing portal — ask me." },
            { icon: "compass", heading: "Find templates", body: "Search /templates and /explore for community PDFs." },
          ],
        },
      },
      {
        kind: "suggestions",
        title: "Try one",
        payload: {
          items: [
            { label: "Show pricing", prompt: "/pricing" },
            { label: "List all commands", prompt: "/shortcommands" },
            { label: "Draft an invoice", prompt: "Draft a one-page invoice for $4,500 of design work" },
            { label: "Compare plans", prompt: "What's the difference between Pro and Unlimited?" },
          ],
        },
      },
    ],
  },
  {
    name: "/shortcommands",
    description: "List every slash command",
    aliases: ["/commands", "/cmds"],
    group: "Help",
    kind: "widget",
    intro: "Every slash command — grouped by what it does. Click one to run it.",
    getWidgets: () => [
      {
        kind: "shortcommands",
        payload: {
          items: COMMANDS.map((c) => ({ command: c.name, description: c.description, group: c.group })),
        },
      },
    ],
  },

  // ── Navigation ──────────────────────────────────────────────────────
  { name: "/home", description: "Go to the homepage", group: "Navigation", kind: "nav", href: "/" },
  { name: "/dashboard", description: "Open your dashboard", group: "Navigation", kind: "nav", href: "/dashboard" },
  { name: "/explore", description: "Browse community PDFs", group: "Navigation", kind: "nav", href: "/explore" },
  { name: "/templates", description: "Browse templates", group: "Navigation", kind: "nav", href: "/templates" },
  { name: "/blog", description: "Read the blog", group: "Navigation", kind: "nav", href: "/blog" },
  { name: "/signin", description: "Sign in or create an account", aliases: ["/login"], group: "Account", kind: "nav", href: "/sign-in" },
  { name: "/privacy", description: "Privacy policy", group: "Navigation", kind: "nav", href: "/privacy" },
  { name: "/terms", description: "Terms of service", group: "Navigation", kind: "nav", href: "/terms" },

  // ── Sales ───────────────────────────────────────────────────────────
  {
    name: "/pricing",
    description: "Show plans and prices",
    aliases: ["/plans", "/price"],
    group: "Sales",
    kind: "widget",
    intro: "Three plans. No setup fees. Cancel anytime.",
    getWidgets: () => [
      {
        kind: "pricing",
        payload: {
          plans: [
            {
              name: "Free",
              price: "$0",
              period: "forever",
              features: ["3 documents", "Standard AI (Haiku)", "Public sharing", "PNG + PDF export"],
              ctaLabel: "Get started",
              ctaHref: "/sign-in",
            },
            {
              name: "Pro",
              price: "$9",
              period: "/mo",
              features: ["Unlimited documents", "Premium AI (Sonnet)", "Private sharing", "Priority rendering", "300 assistant msgs/day"],
              ctaLabel: "Upgrade",
              ctaHref: "/dashboard?upgrade=pro",
              highlight: true,
            },
            {
              name: "Unlimited",
              price: "$50",
              period: "/mo",
              features: ["Everything in Pro", "2,000 assistant msgs/day", "Custom domains", "Priority support"],
              ctaLabel: "Go unlimited",
              ctaHref: "/dashboard?upgrade=unlimited",
            },
          ],
        },
      },
      {
        kind: "suggestions",
        payload: {
          items: [
            { label: "Compare Pro vs Unlimited", prompt: "Compare Pro and Unlimited in 5 bullets" },
            { label: "Show the FAQ", prompt: "/faq" },
          ],
        },
      },
    ],
  },
  {
    name: "/compare",
    description: "Compare plans side-by-side",
    group: "Sales",
    kind: "widget",
    intro: "Side-by-side comparison.",
    getWidgets: () => [
      {
        kind: "table",
        payload: {
          columns: ["Feature", "Free", "Pro $9/mo", "Unlimited $50/mo"],
          rows: [
            ["Documents", "3", "Unlimited", "Unlimited"],
            ["AI model", "Haiku 4.5", "Sonnet 4.6", "Sonnet 4.6"],
            ["Assistant msgs/day", "30", "300", "2,000"],
            ["Private sharing", "—", "✓", "✓"],
            ["Custom domains", "—", "—", "✓"],
            ["Priority support", "—", "—", "✓"],
          ],
        },
      },
    ],
  },
  {
    name: "/book",
    description: "Book a 15-minute walkthrough",
    aliases: ["/demo", "/call"],
    group: "Sales",
    kind: "widget",
    intro: "Pick a slot or email **hey@megabyte.space** — we respond within a business day.",
    getWidgets: () => [
      {
        kind: "cta",
        payload: { label: "Email hey@megabyte.space", href: "mailto:hey@megabyte.space", variant: "primary", external: true },
      },
    ],
  },
  {
    name: "/contact",
    description: "Contact info",
    group: "Support",
    kind: "widget",
    intro: "Reach us any time.",
    getWidgets: () => [
      {
        kind: "link-list",
        payload: {
          items: [
            { label: "Email — hey@megabyte.space", href: "mailto:hey@megabyte.space", external: true },
            { label: "Security — security@megabyte.space", href: "mailto:security@megabyte.space", external: true },
            { label: "GitHub issues", href: "https://github.com/megabytelabs/megabyte-pdf/issues", description: "Bugs + feature requests", external: true },
          ],
        },
      },
    ],
  },

  // ── Account ─────────────────────────────────────────────────────────
  { name: "/account", description: "View your account", group: "Account", kind: "nav", href: "/dashboard" },
  {
    name: "/upgrade",
    description: "Upgrade your plan",
    group: "Account",
    kind: "nav",
    href: "/dashboard?upgrade=pro",
  },
  {
    name: "/billing",
    description: "Manage billing",
    group: "Account",
    kind: "nav",
    href: "/dashboard?billing=open",
  },
  {
    name: "/signout",
    description: "Sign out",
    aliases: ["/logout"],
    group: "Account",
    kind: "nav",
    href: "/api/auth/signout",
  },

  // ── Content ─────────────────────────────────────────────────────────
  {
    name: "/invoice",
    description: "Draft an invoice",
    group: "Content",
    kind: "prompt",
    getPrompt: (args) =>
      `Draft a professional one-page invoice in HTML/CSS suitable for the editor. ${args || "Use placeholder client + line items totaling $4,500."} Include header, line item table, totals row, and payment terms.`,
  },
  {
    name: "/resume",
    description: "Draft a resume",
    aliases: ["/cv"],
    group: "Content",
    kind: "prompt",
    getPrompt: (args) =>
      `Draft a clean two-column resume in HTML/CSS. ${args || "Mid-career software engineer, 7 years experience."} Single page. Use semantic headings, no inline styles outside body.`,
  },
  {
    name: "/proposal",
    description: "Draft a client proposal",
    group: "Content",
    kind: "prompt",
    getPrompt: (args) =>
      `Draft a one-page client proposal in HTML/CSS. ${args || "Logo redesign for a SaaS startup, $4,800 fixed price."} Include scope, deliverables, timeline, price.`,
  },
  {
    name: "/contract",
    description: "Draft a simple contract",
    group: "Content",
    kind: "prompt",
    getPrompt: (args) =>
      `Draft a one-page freelance service contract in HTML/CSS. ${args || "Web design project, $5,000 total."} Include scope, payment schedule, IP ownership, termination.`,
  },
  {
    name: "/cover-letter",
    description: "Draft a cover letter",
    group: "Content",
    kind: "prompt",
    getPrompt: (args) =>
      `Draft a one-page cover letter in HTML/CSS. ${args || "Applying for a senior product designer role."} Three paragraphs, action verbs, no fluff.`,
  },
  {
    name: "/report",
    description: "Draft a quarterly report",
    group: "Content",
    kind: "prompt",
    getPrompt: (args) =>
      `Draft a one-page executive summary report in HTML/CSS. ${args || "Q3 results for a SaaS company."} Include 3 KPIs, narrative, next-quarter targets.`,
  },
  {
    name: "/search",
    description: "Search community PDFs + docs",
    aliases: ["/find"],
    group: "Content",
    kind: "prompt",
    getPrompt: (args) =>
      `Search the Megabyte PDF community library, templates, and docs for: ${args || "the user's question"}. Return up to 6 results as a \`search-results\` widget — each item with title, href (must be a real /explore/<slug>, /templates/<slug>, /blog/<slug>, or /docs/<page> path), a one-sentence snippet, an eyebrow ("Template" | "Community" | "Doc" | "Blog"), and a 0-1 relevance score. If no matches, return a short text explaining no results and a \`suggestions\` widget with 3 alternate queries.`,
  },

  // ── Editor ──────────────────────────────────────────────────────────
  {
    name: "/summarize",
    description: "Summarize the current document",
    group: "Editor",
    kind: "prompt",
    getPrompt: (args) =>
      `Summarize the current document in 3 bullets. ${args || ""} Cite specific numbers or section names where helpful.`,
  },
  {
    name: "/improve",
    description: "Suggest 3 concrete improvements",
    group: "Editor",
    kind: "prompt",
    getPrompt: () =>
      "Look at the current document and propose 3 concrete improvements (layout, copy, structure). For each, give the exact change as HTML/CSS the user can paste.",
  },
  {
    name: "/explain",
    description: "Explain selected text or HTML",
    group: "Editor",
    kind: "prompt",
    getPrompt: (args) =>
      `Explain the following in plain English. ${args ? `\n\n${args}` : "Use the current document selection if present."}`,
  },
  {
    name: "/page-break",
    description: "Show how to add a page break",
    group: "Editor",
    kind: "widget",
    intro: "Drop this CSS rule anywhere you want a hard page break in the PDF.",
    getWidgets: () => [
      {
        kind: "code",
        title: "page-break CSS",
        payload: {
          language: "css",
          code: ".page-break { page-break-before: always; break-before: page; }\n",
        },
      },
      {
        kind: "code",
        title: "HTML usage",
        payload: {
          language: "html",
          code: `<section>First page content</section>\n<div class="page-break"></div>\n<section>Second page content</section>\n`,
        },
      },
    ],
  },

  // ── Tools ───────────────────────────────────────────────────────────
  { name: "/new", description: "Start a new thread", group: "Tools", kind: "ui", action: "new" },
  { name: "/clear", description: "Clear current thread", group: "Tools", kind: "ui", action: "clear" },
  { name: "/export", description: "Download thread as markdown", group: "Tools", kind: "ui", action: "export" },
  { name: "/copy", description: "Copy last assistant reply", group: "Tools", kind: "ui", action: "copyLast" },
  { name: "/stop", description: "Stop the current response", group: "Tools", kind: "ui", action: "stop" },
  { name: "/regenerate", description: "Regenerate the last reply", aliases: ["/retry"], group: "Tools", kind: "ui", action: "regenerate" },
  { name: "/settings", description: "Open chat settings", group: "Tools", kind: "ui", action: "settings" },
  { name: "/feedback", description: "Send feedback to the team", group: "Tools", kind: "ui", action: "feedback" },
  { name: "/share", description: "Copy a link to this conversation", group: "Tools", kind: "ui", action: "share" },

  // ── Support ─────────────────────────────────────────────────────────
  {
    name: "/faq",
    description: "Frequently asked questions",
    group: "Support",
    kind: "widget",
    intro: "Quick answers to the most-asked questions.",
    getWidgets: () => [
      {
        kind: "faq",
        payload: {
          items: [
            { q: "Is there a free plan?", a: "Yes — 3 documents, standard AI, public sharing. No credit card needed." },
            { q: "Can I export real PDFs?", a: "Yes — every document renders to a real, printable PDF via headless Chrome. Multi-page supported." },
            { q: "How do I keep documents private?", a: "Pro and Unlimited plans support private sharing — only people with the link can view." },
            { q: "Do you store my documents?", a: "Yes, in Cloudflare D1 with daily backups. You can delete any document permanently from the dashboard." },
            { q: "Can I cancel anytime?", a: "Yes — cancel in the billing portal. You keep access through the end of your billing period." },
            { q: "How do I get support?", a: "Email hey@megabyte.space or open a GitHub issue. We respond within a business day." },
          ],
        },
      },
    ],
  },
  {
    name: "/docs",
    description: "Open the docs",
    group: "Support",
    kind: "widget",
    intro: "Everything we've written down.",
    getWidgets: () => [
      {
        kind: "link-list",
        payload: {
          items: [
            { label: "AI Chat — usage + extension guide", href: "/blog/ai-chat", description: "How this panel works." },
            { label: "Document editor — keyboard shortcuts", href: "/blog/editor-shortcuts", description: "Shortcuts + tips." },
            { label: "Templates", href: "/templates", description: "Pre-built layouts." },
            { label: "Community PDFs", href: "/explore", description: "Browse what others have made." },
          ],
        },
      },
    ],
  },
  {
    name: "/status",
    description: "Live system status",
    aliases: ["/health"],
    group: "Support",
    kind: "widget",
    intro: "Megabyte PDF subsystem status — refreshed on every page load.",
    getWidgets: () => [
      {
        kind: "status",
        title: "All systems",
        payload: {
          overall: "operational",
          href: "/api/health",
          items: [
            { label: "API", status: "operational" },
            { label: "PDF rendering (headless Chrome)", status: "operational" },
            { label: "Public sharing (/s/<slug>)", status: "operational" },
            { label: "AI assistant", status: "operational" },
            { label: "Email delivery", status: "operational" },
          ],
        },
      },
    ],
  },
  {
    name: "/changelog",
    description: "What shipped recently",
    aliases: ["/whatsnew", "/releases"],
    group: "Support",
    kind: "widget",
    intro: "Recent releases — full notes at [/blog](/blog).",
    getWidgets: () => [
      {
        kind: "timeline",
        title: "Recent releases",
        payload: {
          items: [
            { when: "May 2026", title: "AI Chat side panel", body: "World-class assistant with widgets, slash commands, and per-message feedback.", tag: "Feature", href: "/blog/ai-chat" },
            { when: "Apr 2026", title: "Podcast teaser + RSS feed", body: "/podcast/feed.xml is live, plus a homepage teaser card.", tag: "Feature" },
            { when: "Mar 2026", title: "Community PDF thumbnails", body: "/s/thumb/<slug>.svg renders brand-card SVG previews, cached 7d at edge.", tag: "Polish" },
            { when: "Feb 2026", title: "Pro plan + Stripe billing", body: "Self-serve upgrade flow with portal access at /dashboard?billing=open.", tag: "Feature" },
          ],
        },
      },
    ],
  },
  {
    name: "/shortcuts",
    description: "Keyboard shortcuts",
    aliases: ["/keyboard", "/keys"],
    group: "Support",
    kind: "widget",
    intro: "Everything you can do without leaving the keyboard.",
    getWidgets: () => [
      {
        kind: "table",
        payload: {
          columns: ["Shortcut", "Does"],
          rows: [
            ["⌘K  /  Ctrl+K", "Toggle this AI Chat panel"],
            ["Esc", "Close the panel (focus returns to trigger)"],
            ["↑  /  ↓", "Cycle through previous prompts"],
            ["Enter", "Send message"],
            ["Shift+Enter", "Newline in the composer"],
            ["/", "Open the slash-command palette"],
            ["⌘C on a message", "Copy the reply to clipboard"],
          ],
        },
      },
    ],
  },
  {
    name: "/newsletter",
    description: "Subscribe to product updates",
    aliases: ["/subscribe"],
    group: "Support",
    kind: "widget",
    intro: "One short email every few weeks. Releases, tips, no spam. Unsubscribe with one click.",
    getWidgets: () => [
      {
        kind: "form",
        title: "Get product updates",
        payload: {
          action: "/api/newsletter/subscribe",
          submitLabel: "Subscribe",
          fields: [
            { name: "email", label: "Email", type: "email", placeholder: "you@example.com", required: true },
          ],
        },
      },
      {
        kind: "callout",
        payload: { tone: "tip", markdown: "We send fewer than 12 emails per year. Your address is never sold or shared." },
      },
    ],
  },
  {
    name: "/podcast",
    description: "Listen to the Megabyte PDF podcast",
    aliases: ["/listen"],
    group: "Support",
    kind: "widget",
    intro: "Short episodes about document automation, AI, and Cloudflare Workers.",
    getWidgets: () => [
      {
        kind: "card",
        payload: {
          eyebrow: "Podcast",
          heading: "Megabyte PDF — the show",
          body: "Bite-size episodes on prompt-to-PDF, Workers, and shipping SaaS solo.",
          href: "/podcast",
        },
      },
      {
        kind: "link-list",
        payload: {
          items: [
            { label: "RSS feed (Apple, Pocket Casts, Overcast)", href: "/podcast/feed.xml", description: "Paste into any podcast player." },
            { label: "Episode index", href: "/podcast", description: "All episodes + show notes." },
          ],
        },
      },
    ],
  },
  {
    name: "/features",
    description: "What Megabyte PDF can do",
    group: "Sales",
    kind: "widget",
    intro: "The full feature set — prompt-to-PDF, AI editor, sharing, and exports.",
    getWidgets: () => [
      {
        kind: "feature-grid",
        title: "Core features",
        payload: {
          items: [
            { icon: "sparkles", heading: "Prompt → PDF", body: "Describe a document in plain English. Get a printable PDF in seconds." },
            { icon: "code", heading: "Live HTML/CSS editor", body: "Hand-tune any document. AI suggests improvements." },
            { icon: "compass", heading: "Templates + community", body: "Start from invoices, resumes, proposals, contracts, and reports." },
            { icon: "lifebuoy", heading: "Real PDF export", body: "Headless Chrome rendering — multi-page, page breaks, embedded fonts." },
          ],
        },
      },
      {
        kind: "suggestions",
        payload: {
          items: [
            { label: "Show pricing", prompt: "/pricing" },
            { label: "Compare with PandaDoc + DocuSign", prompt: "/compare" },
            { label: "Browse templates", prompt: "/templates" },
          ],
        },
      },
    ],
  },
  {
    name: "/accessibility",
    description: "Accessibility statement + a11y settings",
    aliases: ["/a11y"],
    group: "Support",
    kind: "widget",
    intro: "Megabyte PDF targets WCAG 2.2 AA across the editor, dashboard, and public share pages.",
    getWidgets: () => [
      {
        kind: "checklist",
        title: "What we ship by default",
        payload: {
          items: [
            { label: "Keyboard navigable", done: true, note: "every interactive control reachable + visible focus rings" },
            { label: "Screen-reader labels", done: true, note: "ARIA landmarks + form labels on every input" },
            { label: "Reduced motion respected", done: true, note: "honors prefers-reduced-motion" },
            { label: "AA contrast", done: true, note: "≥ 4.5:1 body text, ≥ 3:1 large text" },
            { label: "Target sizes ≥ 24px", done: true, note: "WCAG 2.2 SC 2.5.8" },
            { label: "Skip-to-content link", done: true },
          ],
        },
      },
      {
        kind: "callout",
        payload: {
          tone: "info",
          markdown: "Found an accessibility issue? Email **a11y@megabyte.space** or open a GitHub issue — we treat a11y bugs as P0.",
        },
      },
    ],
  },
  {
    name: "/support",
    description: "How to get help",
    aliases: ["/help-me"],
    group: "Support",
    kind: "widget",
    intro: "Pick whichever lane fits.",
    getWidgets: () => [
      {
        kind: "multi-choice",
        payload: {
          question: "What do you need?",
          items: [
            { label: "Read the FAQ", prompt: "/faq", description: "Most questions are answered there." },
            { label: "Open the docs", prompt: "/docs", description: "Setup, exports, sharing, billing." },
            { label: "Email a human", prompt: "/contact", description: "We reply within a business day." },
            { label: "Check system status", prompt: "/status", description: "Live operational status of every subsystem." },
          ],
        },
      },
    ],
  },
];

const NAME_INDEX: Map<string, Command> = new Map();
for (const c of COMMANDS) {
  NAME_INDEX.set(c.name, c);
  for (const a of c.aliases ?? []) NAME_INDEX.set(a, c);
}

/** Parse "/cmd args…" into { command, args, raw }. Returns null if not a slash command. */
export function parseSlash(input: string): { command: Command; args: string; raw: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const space = trimmed.indexOf(" ");
  const head = (space === -1 ? trimmed : trimmed.slice(0, space)).toLowerCase();
  const args = space === -1 ? "" : trimmed.slice(space + 1).trim();
  const cmd = NAME_INDEX.get(head);
  if (!cmd) return null;
  return { command: cmd, args, raw: trimmed };
}

/** Filter the registry by prefix — case-insensitive. */
export function filterCommands(query: string, limit = 8): Command[] {
  const q = query.trim().toLowerCase();
  if (!q.startsWith("/")) return [];
  const result: Command[] = [];
  for (const c of COMMANDS) {
    if (c.name.startsWith(q) || (c.aliases ?? []).some((a) => a.startsWith(q))) {
      result.push(c);
      if (result.length >= limit) break;
    }
  }
  return result;
}

/** Stable list of all registered command names (for tests + completeness checks). */
export function listCommandNames(): string[] {
  return COMMANDS.map((c) => c.name);
}
