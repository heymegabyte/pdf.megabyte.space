import type { AppConfig } from "./config";

type EventEntry = { name: string; props?: Record<string, unknown> };

let initialized = false;
let sentryMod: typeof import("@sentry/react") | null = null;
let posthogMod: { default: typeof import("posthog-js")["default"] } | null = null;
let queue: EventEntry[] = [];
let userQueue: Array<{ id: string; traits?: Record<string, unknown> }> = [];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// PostHog public project keys are prefixed `phc_` (project-config).
// `phx_` is a personal API key (server-side only) and produces 404 + 401
// from the autocapture endpoint when used in the browser.
const isValidPostHogClientKey = (k: string | undefined): k is string =>
  Boolean(k && /^phc_[A-Za-z0-9]{20,}$/.test(k));

export async function initAnalytics(config: AppConfig) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const posthogOk = isValidPostHogClientKey(config.posthogKey);
  const [sentry, ph] = await Promise.all([
    config.sentryDsn ? import("@sentry/react") : Promise.resolve(null),
    posthogOk ? import("posthog-js") : Promise.resolve(null),
  ]);

  if (sentry && config.sentryDsn) {
    sentryMod = sentry;
    sentry.init({
      dsn: config.sentryDsn,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [sentry.browserTracingIntegration()],
      environment: import.meta.env.MODE,
    });
  }

  if (ph && posthogOk) {
    posthogMod = ph as typeof posthogMod;
    ph.default.init(config.posthogKey, {
      api_host: config.posthogHost,
      persistence: "memory",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      disable_session_recording: true,
    });
  }

  if (config.gtmId) {
    window.dataLayer = window.dataLayer ?? [];
    // GTM snippet already injected via index.html; just ensure dataLayer exists
  }

  if (config.ga4Id && !config.gtmId) {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${config.ga4Id}`;
    s.onload = () => {
      window.gtag!("js", new Date());
      window.gtag!("config", config.ga4Id, { send_page_view: true });
    };
    document.head.appendChild(s);
  }

  // Flush queued events now that SDKs are ready
  for (const e of queue) _send(e.name, e.props);
  queue = [];
  for (const u of userQueue) _identify(u.id, u.traits);
  userQueue = [];
}

function _send(name: string, props?: Record<string, unknown>) {
  posthogMod?.default.capture?.(name, props);
  if (window.gtag) {
    window.gtag("event", name, props);
  } else if (window.dataLayer) {
    window.dataLayer.push({ event: name, ...props });
  }
  sentryMod?.addBreadcrumb({ category: "event", message: name, data: props, level: "info" });
}

function _identify(userId: string, traits?: Record<string, unknown>) {
  posthogMod?.default.identify?.(userId, traits);
  sentryMod?.setUser({ id: userId, ...traits });
}

export function captureEvent(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!initialized) { queue.push({ name, props }); return; }
  _send(name, props);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!initialized) { userQueue.push({ id: userId, traits }); return; }
  _identify(userId, traits);
}
