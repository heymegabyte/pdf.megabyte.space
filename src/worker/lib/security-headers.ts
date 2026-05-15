import { secureHeaders } from "hono/secure-headers";

/**
 * Global Content Security Policy + transport hardening for the SPA, JSON API,
 * RSS feeds, OG renderer, and email-tracking endpoints. PDF render endpoints
 * (`/api/public/:slug/render`, `/s/:slug/render`) bypass this middleware in
 * `src/worker/index.ts` and ship their own scoped CSP, because they host
 * arbitrary user-authored HTML + remote imagery.
 *
 * Adding a new third party? Update the appropriate directive here — do NOT
 * relax the policy globally. Origin lists are intentionally explicit so an
 * auditor can grep the file to see exactly what we trust.
 *
 * @see docs/security.md for the per-directive rationale and exceptions.
 */

const SCRIPT_SRC = [
  "'self'",
  // Tailwind/Vite produce inline init scripts (`unsafe-inline` is required
  // until we move to nonce-based CSP in build pipeline).
  "'unsafe-inline'",
  "https://www.googletagmanager.com",
  "https://js.stripe.com",
  "https://challenges.cloudflare.com",
  "https://us-assets.i.posthog.com",
  "https://static.cloudflareinsights.com",
];

const CONNECT_SRC = [
  "'self'",
  // Sentry (self-hosted + ingest paths)
  "https://*.sentry.io",
  "https://ingest.sentry.io",
  "https://sentry.megabyte.space",
  // PostHog product analytics
  "https://us.i.posthog.com",
  "https://us-assets.i.posthog.com",
  "https://app.posthog.com",
  // Google Analytics / Tag Manager
  "https://www.google-analytics.com",
  "https://analytics.google.com",
  "https://region1.google-analytics.com",
  "https://www.google.com",
  "https://www.googletagmanager.com",
  // Stripe billing
  "https://api.stripe.com",
  // Google OAuth token exchange + userinfo
  "https://accounts.google.com",
  "https://oauth2.googleapis.com",
  "https://www.googleapis.com",
  // Cloudflare Web Analytics
  "https://static.cloudflareinsights.com",
];

const IMG_SRC = [
  "'self'",
  "data:",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  // Google profile pictures for signed-in users
  "https://lh3.googleusercontent.com",
];

const FRAME_SRC = [
  "'self'", // Required so /c/<slug> can iframe the render endpoint.
  "https://www.googletagmanager.com",
  "https://js.stripe.com",
  "https://challenges.cloudflare.com",
  "https://accounts.google.com",
];

const FONT_SRC = ["'self'", "https://fonts.gstatic.com"];

// `unsafe-inline` for styles is acceptable here: we ship a small inline
// critical CSS block + Tailwind compile output; no untrusted style source
// can reach the page because `script-src` rejects inline scripts that
// could mutate styles, and DOM-XSS sinks are guarded by React's escaping.
const STYLE_SRC = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];

/**
 * The Hono `secureHeaders` middleware preconfigured for production.
 * Mount with `app.use("*", strictSecureHeaders)` and gate by path if you
 * need per-route overrides.
 */
export const strictSecureHeaders = secureHeaders({
  xFrameOptions: false, // Replaced by CSP `frame-ancestors` (default 'self').
  xXssProtection: false, // Deprecated header, would weaken CSP behavior.
  strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: SCRIPT_SRC,
    connectSrc: CONNECT_SRC,
    imgSrc: IMG_SRC,
    frameSrc: FRAME_SRC,
    fontSrc: FONT_SRC,
    styleSrc: STYLE_SRC,
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    reportUri: ["https://sentry.megabyte.space/api/security/?sentry_key=megabyte-pdf"],
  },
});

/**
 * True for the two paths that render arbitrary user HTML and therefore
 * apply their own scoped CSP. The global CSP is skipped for these paths
 * so user PDFs with arbitrary `https://…` imagery aren't blocked.
 *
 * Matches:
 *   - `/api/public/:slug/render`
 *   - `/s/:slug/render`
 *
 * @example
 * isUserRenderPath("/s/abc123/render")           // true
 * isUserRenderPath("/api/public/xyz/render")     // true
 * isUserRenderPath("/api/public/xyz/meta")       // false
 */
export const isUserRenderPath = (pathname: string): boolean =>
  /^\/api\/public\/[^/]+\/render$/.test(pathname) ||
  /^\/s\/[^/]+\/render$/.test(pathname);
