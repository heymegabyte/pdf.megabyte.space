export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  PDFS: R2Bucket;
  CACHE: KVNamespace;
  BROWSER: Fetcher;
  AI: Ai;
  APP_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  FREE_PROJECT_LIMIT: string;
  PAID_PROJECT_LIMIT: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID_PRO?: string;
  STRIPE_PRICE_ID_UNLIMITED?: string;
  SENTRY_DSN?: string;
  SENTRY_DSN_CLIENT?: string;
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
  GTM_CONTAINER_ID?: string;
  GA4_MEASUREMENT_ID?: string;
  TRENDING_HALFLIFE_DAYS?: string;
  TRENDING_CANDIDATE_POOL?: string;
  LISTMONK_BASE_URL?: string;
  LISTMONK_API_USER?: string;
  LISTMONK_API_TOKEN?: string;
  LISTMONK_FROM_EMAIL?: string;
  LISTMONK_FROM_NAME?: string;
  LISTMONK_LIST_ID?: string;
  LISTMONK_PODCAST_LIST_ID?: string;
  LISTMONK_NEWSLETTER_LIST_ID?: string;
  EMAIL_UNSUB_SECRET?: string;
  ADMIN_EMAIL?: string;
  CRON_SECRET?: string;
}

export interface Variables {
  userId: string;
  userEmail: string;
}
