export interface EmptyChip {
  label: string;
  cmd: string;
}

const DEFAULT_CHIPS: EmptyChip[] = [
  { label: "Show pricing", cmd: "/pricing" },
  { label: "Compare plans", cmd: "/compare" },
  { label: "Draft an invoice", cmd: "/invoice" },
  { label: "Draft a resume", cmd: "/resume" },
  { label: "FAQ", cmd: "/faq" },
  { label: "All commands", cmd: "/shortcommands" },
];

/**
 * Returns route-tailored starter chips for the AI chat empty state. Keeps the
 * floor at 4 chips and ceiling at 6 so the layout never reflows.
 */
export function chipsForPath(path: string | undefined): EmptyChip[] {
  const p = (path || "/").toLowerCase();

  if (p.startsWith("/p/")) {
    return [
      { label: "Improve this draft", cmd: "/improve" },
      { label: "Summarize", cmd: "/summarize" },
      { label: "Explain", cmd: "/explain" },
      { label: "Insert page break", cmd: "/page-break" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  if (p.startsWith("/dashboard")) {
    return [
      { label: "Compare plans", cmd: "/compare" },
      { label: "Upgrade", cmd: "/upgrade" },
      { label: "Billing", cmd: "/billing" },
      { label: "Browse templates", cmd: "/templates" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  if (p.startsWith("/templates") || p.startsWith("/pdf-template")) {
    return [
      { label: "Draft an invoice", cmd: "/invoice" },
      { label: "Draft a resume", cmd: "/resume" },
      { label: "Draft a proposal", cmd: "/proposal" },
      { label: "Draft a contract", cmd: "/contract" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  if (p.startsWith("/explore") || p.startsWith("/c/") || p.startsWith("/t/")) {
    return [
      { label: "Search community PDFs", cmd: "/search" },
      { label: "Top templates", cmd: "/templates" },
      { label: "Compare plans", cmd: "/compare" },
      { label: "FAQ", cmd: "/faq" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  if (p.startsWith("/blog") || p.startsWith("/pdf-from-prompt") || p.startsWith("/free-")) {
    return [
      { label: "Subscribe to updates", cmd: "/newsletter" },
      { label: "Listen to the podcast", cmd: "/podcast" },
      { label: "What's new", cmd: "/changelog" },
      { label: "FAQ", cmd: "/faq" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  if (p.startsWith("/podcast")) {
    return [
      { label: "Subscribe to updates", cmd: "/newsletter" },
      { label: "Episode RSS", cmd: "/podcast" },
      { label: "What's new", cmd: "/changelog" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  if (p.startsWith("/sign-in") || p.startsWith("/sign-up")) {
    return [
      { label: "Compare plans", cmd: "/compare" },
      { label: "Show pricing", cmd: "/pricing" },
      { label: "FAQ", cmd: "/faq" },
      { label: "Sign in", cmd: "/signin" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  if (p.startsWith("/guest")) {
    return [
      { label: "Sign in", cmd: "/signin" },
      { label: "Compare plans", cmd: "/compare" },
      { label: "Draft an invoice", cmd: "/invoice" },
      { label: "FAQ", cmd: "/faq" },
      { label: "All commands", cmd: "/shortcommands" },
    ];
  }

  return DEFAULT_CHIPS;
}
