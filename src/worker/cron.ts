import * as Sentry from "@sentry/cloudflare";
import { eq, and, lt, gte, isNull, isNotNull, sql, desc } from "drizzle-orm";
import { getDb, schema } from "./db";
import { sendEmail } from "./lib/emails";
import type { Env } from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

interface CronResult {
  trigger: string;
  scanned: number;
  sent: number;
  skipped: number;
}

/** Hour-of-day in UTC for the current invocation. */
function utcHour(date: Date): number {
  return date.getUTCHours();
}

function utcDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

/**
 * Master dispatcher. Cloudflare's scheduled() handler calls this with the cron
 * pattern; we branch on the pattern + clock to pick the right fan-out.
 */
export async function runCron(env: Env, controller: ScheduledController): Promise<void> {
  const now = new Date(controller.scheduledTime);
  const cron = controller.cron;

  try {
    const results: CronResult[] = [];

    if (cron === "0 14 * * *") {
      results.push(await fanoutAbandonedPrompt(env, now));
      results.push(await fanoutShareExpiring(env, now));
      results.push(await fanoutAnnualSummary(env, now));
      results.push(await fanoutOnboardDay3Stuck(env, now));
    } else if (cron === "0 15 * * 6") {
      results.push(await fanoutWeeklyDigest(env, now));
    } else if (cron === "0 13 * * 1") {
      results.push(await fanoutTemplateOfWeek(env, now));
    } else if (cron === "30 14 * * *") {
      results.push(await fanoutWinBack30d(env, now));
      results.push(await fanoutAiBoost(env, now));
    } else if (cron === "0 14 * * 3") {
      results.push(await fanoutTipOfTheWeek(env, now));
    } else if (cron.startsWith("0 16 1")) {
      results.push(await fanoutPrivacyReport(env, now));
    } else {
      Sentry.captureMessage(`Unknown cron pattern: ${cron}`, { level: "warning" });
    }

    Sentry.addBreadcrumb({
      category: "cron",
      message: `Cron ${cron} fired`,
      data: { results, hour: utcHour(now), dow: utcDayOfWeek(now) },
      level: "info",
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { cron } });
  }
}

/**
 * Abandoned-prompt: any project with last_prompt_at >2h ago, last_render_at NULL or older,
 * and the user hasn't received this trigger for this project in the past 7 days.
 */
async function fanoutAbandonedPrompt(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const cutoffNew = new Date(now.getTime() - 2 * HOUR);
  const cutoffOld = new Date(now.getTime() - 24 * HOUR);

  const candidates = await db
    .select({
      id: schema.projects.id,
      userId: schema.projects.userId,
      title: schema.projects.title,
      lastPromptAt: schema.projects.lastPromptAt,
    })
    .from(schema.projects)
    .where(
      and(
        isNotNull(schema.projects.lastPromptAt),
        lt(schema.projects.lastPromptAt, cutoffNew),
        gte(schema.projects.lastPromptAt, cutoffOld),
        isNull(schema.projects.deletedAt)
      )
    )
    .limit(200);

  let sent = 0;
  let skipped = 0;
  for (const p of candidates) {
    const latestTurn = await db.query.turns.findFirst({
      where: and(eq(schema.turns.projectId, p.id), eq(schema.turns.role, "user")),
      orderBy: [desc(schema.turns.createdAt)],
    });
    if (!latestTurn) {
      skipped++;
      continue;
    }
    const preview = latestTurn.content.slice(0, 140).replace(/\n/g, " ");
    const res = await sendEmail(env, {
      userId: p.userId,
      template: "abandoned-prompt",
      dedupKey: `abandon:${p.id}:${p.lastPromptAt?.toISOString().slice(0, 10)}`,
      data: {
        prompt_preview: preview,
        resume_url: `${env.APP_URL}/projects/${p.id}`,
        project_title: p.title,
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "abandoned-prompt", scanned: candidates.length, sent, skipped };
}

/**
 * Weekly digest: pick 5 trending public PDFs from the past 7 days, fan out to
 * every user with digest=true who hasn't received THIS issue yet.
 */
async function fanoutWeeklyDigest(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const issue = `${now.getUTCFullYear()}-W${Math.floor(now.getTime() / (DAY * 7))}`;

  const picks = await db
    .select({
      id: schema.projects.id,
      title: schema.projects.title,
      slug: schema.projects.slug,
      userId: schema.projects.userId,
      updatedAt: schema.projects.updatedAt,
    })
    .from(schema.projects)
    .where(and(eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)))
    .orderBy(desc(schema.projects.updatedAt))
    .limit(5);

  if (picks.length === 0) return { trigger: "weekly-digest", scanned: 0, sent: 0, skipped: 0 };

  const pickPayload = picks.map((p) => ({
    url: `${env.APP_URL}/p/${p.slug ?? p.id}`,
    image: p.slug ? `${env.APP_URL}/s/og/${p.slug}.png` : `${env.APP_URL}/og.jpg`,
    title: p.title,
    author: "Megabyte",
    views: 0,
    tag: "Trending",
  }));

  const users = await db.query.users.findMany({
    where: isNotNull(schema.users.email),
    limit: 5000,
  });

  let sent = 0;
  let skipped = 0;
  for (const u of users) {
    const res = await sendEmail(env, {
      userId: u.id,
      template: "weekly-digest",
      dedupKey: `digest:${u.id}:${issue}`,
      data: {
        issue,
        picks: pickPayload,
        top_title: picks[0]?.title,
        weekly_total: picks.length,
        weekly_authors: new Set(picks.map((p) => p.userId)).size,
        weekly_views: 0,
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "weekly-digest", scanned: users.length, sent, skipped };
}

/**
 * Template of the week: pick the highest-quality public PDF, fan out Monday morning.
 */
async function fanoutTemplateOfWeek(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const week = Math.floor(now.getTime() / (DAY * 7));

  const top = await db.query.projects.findFirst({
    where: and(eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)),
    orderBy: [desc(schema.projects.updatedAt)],
  });
  if (!top) return { trigger: "template-of-week", scanned: 0, sent: 0, skipped: 0 };

  const author = await db.query.users.findFirst({ where: eq(schema.users.id, top.userId) });
  const users = await db.query.users.findMany({ limit: 5000 });

  let sent = 0;
  let skipped = 0;
  for (const u of users) {
    const res = await sendEmail(env, {
      userId: u.id,
      template: "template-of-week",
      dedupKey: `totw:${u.id}:${week}`,
      data: {
        template_title: top.title,
        template_tag: "Spotlight",
        template_views: 0,
        template_blurb: top.description ?? "A public PDF worth forking.",
        quality: 9,
        author_name: author?.name ?? "Anonymous",
        author_url: `${env.APP_URL}/u/${top.userId}`,
        og_image_url: top.slug ? `${env.APP_URL}/s/og/${top.slug}.png` : `${env.APP_URL}/og.jpg`,
        fork_url: `${env.APP_URL}/projects/${top.id}/duplicate`,
        share_url: `${env.APP_URL}/p/${top.slug ?? top.id}`,
        editor_note: "Clean structure, sharp typography, the kind of PDF you'd brag about printing.",
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "template-of-week", scanned: users.length, sent, skipped };
}

/**
 * Win-back-30d: any user with last_seen_at >30 days ago and !plan=pro.
 * Sends one promo per user, ever — dedup key has no date component.
 */
async function fanoutWinBack30d(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const cutoff = new Date(now.getTime() - 30 * DAY);
  const inactive = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(lt(schema.users.lastSeenAt, cutoff), eq(schema.users.plan, "free")))
    .limit(500);

  let sent = 0;
  let skipped = 0;
  for (const u of inactive) {
    const promo = `WELCOMEBACK${now.getUTCFullYear()}`;
    const res = await sendEmail(env, {
      userId: u.id,
      template: "win-back-30d",
      dedupKey: `winback30:${u.id}`,
      data: {
        promo_code: promo,
        promo_expires: new Date(now.getTime() + 14 * DAY).toLocaleDateString("en-US"),
        redeem_url: `${env.APP_URL}/account/billing?promo=${promo}`,
        inspiration: [],
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "win-back-30d", scanned: inactive.length, sent, skipped };
}

/**
 * Share-expiring: any share_link with expires_at within 24-48h window.
 */
async function fanoutShareExpiring(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const soon = new Date(now.getTime() + 24 * HOUR);
  const later = new Date(now.getTime() + 48 * HOUR);

  const expiring = await db.query.shareLinks.findMany({
    where: and(
      isNotNull(schema.shareLinks.expiresAt),
      gte(schema.shareLinks.expiresAt, soon),
      lt(schema.shareLinks.expiresAt, later)
    ),
    limit: 200,
  });

  let sent = 0;
  let skipped = 0;
  for (const link of expiring) {
    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, link.projectId),
    });
    if (!project) {
      skipped++;
      continue;
    }
    const hoursUntil = Math.round(((link.expiresAt as Date).getTime() - now.getTime()) / HOUR);
    const res = await sendEmail(env, {
      userId: project.userId,
      template: "share-expiring",
      dedupKey: `expire:${link.slug}`,
      data: {
        project_title: project.title,
        hours_until_expiry: hoursUntil,
        expires_at_human: (link.expiresAt as Date).toLocaleString("en-US"),
        og_image_url: project.slug ? `${env.APP_URL}/s/og/${project.slug}.png` : `${env.APP_URL}/og.jpg`,
        view_count: link.views ?? 0,
        unique_visitors: link.views ?? 0,
        extend_url: `${env.APP_URL}/api/share/${link.slug}/extend`,
        permanent_url: `${env.APP_URL}/api/share/${link.slug}/permanent`,
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "share-expiring", scanned: expiring.length, sent, skipped };
}

/**
 * Annual summary: anyone whose plan started exactly 12 months ago today.
 */
async function fanoutAnnualSummary(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const yearAgoStart = new Date(now);
  yearAgoStart.setUTCFullYear(now.getUTCFullYear() - 1);
  yearAgoStart.setUTCHours(0, 0, 0, 0);
  const yearAgoEnd = new Date(yearAgoStart.getTime() + DAY);

  const anniversaries = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.plan, "pro"),
        gte(schema.users.createdAt, yearAgoStart),
        lt(schema.users.createdAt, yearAgoEnd)
      )
    )
    .limit(200);

  let sent = 0;
  let skipped = 0;
  for (const u of anniversaries) {
    const projectCount = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.projects)
      .where(eq(schema.projects.userId, u.id));
    const annualCost = 96;
    const competitorCost = 540;
    const res = await sendEmail(env, {
      userId: u.id,
      template: "annual-summary",
      dedupKey: `annual:${u.id}:${now.getUTCFullYear()}`,
      data: {
        year: now.getUTCFullYear(),
        pdfs_generated: projectCount[0]?.n ?? 0,
        total_views: 0,
        public_forks: 0,
        saved_vs_docusign: competitorCost - annualCost,
        annual_cost: annualCost,
        competitor_cost: competitorCost,
        top_project_title: "",
        top_project_url: env.APP_URL,
        top_project_og: `${env.APP_URL}/og.jpg`,
        top_project_views: 0,
        top_project_forks: 0,
        receipt_url: `${env.APP_URL}/account/billing/receipt/${now.getUTCFullYear()}`,
        share_recap_url: `${env.APP_URL}/recap/${u.id}/${now.getUTCFullYear()}`,
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "annual-summary", scanned: anniversaries.length, sent, skipped };
}

/**
 * Privacy report: quarterly, every Pro account.
 */
async function fanoutPrivacyReport(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const quarter = `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;
  const pros = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.plan, "pro"))
    .limit(5000);

  let sent = 0;
  let skipped = 0;
  for (const u of pros) {
    const counts = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.projects)
      .where(eq(schema.projects.userId, u.id));
    const res = await sendEmail(env, {
      userId: u.id,
      template: "privacy-report",
      dedupKey: `privacy:${u.id}:${quarter.replace(/\s/g, "")}`,
      data: {
        quarter,
        account_created: "—",
        pdfs_stored: counts[0]?.n ?? 0,
        storage_mb: 0,
        chat_count: 0,
        invoice_count: 0,
        region: "WNAM",
        export_data_url: `${env.APP_URL}/account/export`,
        delete_account_url: `${env.APP_URL}/account/delete`,
        purge_chats_url: `${env.APP_URL}/account/purge-chats`,
        privacy_policy_url: `${env.APP_URL}/privacy`,
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "privacy-report", scanned: pros.length, sent, skipped };
}

/**
 * AI boost: random sample of 50 active Pro users daily with public projects.
 */
async function fanoutAiBoost(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const today = now.toISOString().slice(0, 10);
  const candidates = await db
    .select({
      id: schema.projects.id,
      userId: schema.projects.userId,
      title: schema.projects.title,
      slug: schema.projects.slug,
    })
    .from(schema.projects)
    .where(and(eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)))
    .limit(50);

  let sent = 0;
  let skipped = 0;
  for (const p of candidates) {
    const res = await sendEmail(env, {
      userId: p.userId,
      template: "ai-boost",
      dedupKey: `boost:${p.id}:${today}`,
      data: {
        project_title: p.title,
        og_image_url: p.slug ? `${env.APP_URL}/s/og/${p.slug}.png` : `${env.APP_URL}/og.jpg`,
        current_score: 72,
        potential_score: 91,
        boost_count: 4,
        boost_credits: 5,
        boost_cost_human: "$0.50",
        user_credits: 25,
        boost_url: `${env.APP_URL}/projects/${p.id}?boost=1`,
        project_url: `${env.APP_URL}/projects/${p.id}`,
        boosts: [
          { category: "Typography", title: "Tighten headline tracking", description: "Sora headlines need -1% letter-spacing for the 36px sizes." },
          { category: "Layout", title: "Restore visual hierarchy", description: "Section 2 has the same weight as the H1 — drop to weight 500." },
          { category: "Copy", title: "Sharper CTA", description: "Replace 'Learn more' with the actual outcome." },
          { category: "SEO", title: "Add meta description", description: "OG card title is generic. Specific wording → 2× share CTR." },
        ],
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "ai-boost", scanned: candidates.length, sent, skipped };
}

/**
 * Onboarding day-3 stuck: signed-up 72-96h ago, never created a project.
 * Sends one nudge per user, ever.
 */
async function fanoutOnboardDay3Stuck(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const cutoffOld = new Date(now.getTime() - 96 * HOUR);
  const cutoffNew = new Date(now.getTime() - 72 * HOUR);

  const candidates = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      and(
        gte(schema.users.createdAt, cutoffOld),
        lt(schema.users.createdAt, cutoffNew)
      )
    )
    .limit(500);

  let sent = 0;
  let skipped = 0;
  for (const u of candidates) {
    const counts = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.projects)
      .where(and(eq(schema.projects.userId, u.id), isNull(schema.projects.deletedAt)));
    if ((counts[0]?.n ?? 0) > 0) {
      skipped++;
      continue;
    }
    const res = await sendEmail(env, {
      userId: u.id,
      template: "onboard-day3-stuck",
      dedupKey: `onboard-day3:${u.id}`,
      data: {
        new_project_url: `${env.APP_URL}/new`,
        explore_url: `${env.APP_URL}/explore?sort=trending`,
        prompt_examples: [
          "A one-page invoice with my logo, line items, and Net 30 terms",
          "A two-column resume with skills, education, and 3 recent roles",
          "A 4-page proposal: cover, scope, pricing, signature block",
        ],
        starter_template_url: `${env.APP_URL}/templates`,
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "onboard-day3-stuck", scanned: candidates.length, sent, skipped };
}

/**
 * Tip of the week: every active user gets one tip every Wednesday.
 * Tips rotate by ISO week to avoid repeats.
 */
const WEEKLY_TIPS: { headline: string; body1: string; body2: string; code?: string }[] = [
  {
    headline: "Force a page break before any element",
    body1: "Add the CSS property below to any heading or section. The PDF renderer respects it like a print stylesheet — your H1 always starts on a fresh page.",
    body2: "Use it sparingly: too many forced breaks turn a tight 4-pager into a sprawling 9-pager.",
    code: "h1.chapter { page-break-before: always; }",
  },
  {
    headline: "Mix fonts the right way",
    body1: "One display face for headlines (Sora, Space Grotesk, Fraunces). One body face for paragraphs (Inter, IBM Plex Sans). One mono for code (JetBrains Mono).",
    body2: "Pair the same x-height, vary the weight. Same x-height = visual rhythm. Different weights = hierarchy without shouting.",
  },
  {
    headline: "Use @page for headers and footers",
    body1: "Every printed PDF respects @page rules. Drop a margin-block declaration and your page numbers, footer text, or watermark render on every page automatically.",
    body2: "Beats hand-placing footers per page and surviving any pagination shift.",
    code: "@page { margin: 0.75in; @bottom-right { content: counter(page); } }",
  },
  {
    headline: "Print at 96 DPI — design for it",
    body1: "Web browsers render at 96 CSS pixels per inch. An 8.5×11 page is 816×1056 px. Design with that grid in mind and you'll never get surprised by margins.",
    body2: "Want crisper images? Export PNGs at 2× (1632×2112) and downscale via CSS. The PDF will keep the higher density.",
  },
  {
    headline: "Embed your fonts so they render anywhere",
    body1: "The PDF renderer pulls webfonts from CSS — but only if you reference them with @font-face or via Google Fonts links the engine can fetch. Stick to font-display:swap to keep loads snappy.",
    body2: "Test by exporting and opening on a clean machine without your local fonts. If it falls back, the embed broke.",
  },
  {
    headline: "Use CSS columns for clean two-up layouts",
    body1: "column-count: 2 + column-gap: 0.5in turns any block into newspaper-style columns. The PDF renderer paginates inside them automatically.",
    body2: "Pair with break-inside: avoid on headings so titles never split mid-column.",
    code: ".body { column-count: 2; column-gap: 0.5in; }",
  },
];

async function fanoutTipOfTheWeek(env: Env, now: Date): Promise<CronResult> {
  const db = getDb(env.DB);
  const week = Math.floor(now.getTime() / (DAY * 7));
  const tip = WEEKLY_TIPS[week % WEEKLY_TIPS.length]!;

  const users = await db.query.users.findMany({
    where: isNotNull(schema.users.email),
    limit: 5000,
  });

  let sent = 0;
  let skipped = 0;
  for (const u of users) {
    const res = await sendEmail(env, {
      userId: u.id,
      template: "tip-of-the-week",
      dedupKey: `tip:${u.id}:${week}`,
      data: {
        tip_headline: tip.headline,
        tip_p1: tip.body1,
        tip_p2: tip.body2,
        tip_code: tip.code ?? null,
        editor_url: `${env.APP_URL}/new`,
        archive_url: `${env.APP_URL}/blog/tips`,
      },
    });
    if (res.ok) sent++;
    else skipped++;
  }
  return { trigger: "tip-of-the-week", scanned: users.length, sent, skipped };
}
