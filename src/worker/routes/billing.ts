import { Hono } from "hono";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import type { Env, Variables } from "../types";
import type { Plan } from "../../shared/plans";
import { sendEmail } from "../lib/emails";
import { PLAN_LABELS, PRO_PRICE_USD, UNLIMITED_PRICE_USD } from "../../shared/plans";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const getStripe = (env: Env) => {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
};

function priceIdForTier(env: Env, tier: "pro" | "unlimited"): string | undefined {
  return tier === "unlimited" ? env.STRIPE_PRICE_ID_UNLIMITED : env.STRIPE_PRICE_ID_PRO;
}

function planForPriceId(env: Env, priceId: string | null | undefined): Plan {
  if (!priceId) return "free";
  if (env.STRIPE_PRICE_ID_UNLIMITED && priceId === env.STRIPE_PRICE_ID_UNLIMITED) return "unlimited";
  if (env.STRIPE_PRICE_ID_PRO && priceId === env.STRIPE_PRICE_ID_PRO) return "pro";
  return "pro";
}

app.post("/checkout", requireAuth, async (c) => {
  const stripe = getStripe(c.env);
  if (!stripe) return c.json({ error: "Billing not configured" }, 503);

  const body = (await c.req.json().catch(() => null)) as { tier?: unknown } | null;
  const tier: "pro" | "unlimited" = body?.tier === "unlimited" ? "unlimited" : "pro";
  const priceId = priceIdForTier(c.env, tier);
  if (!priceId) return c.json({ error: `Plan '${tier}' not available` }, 503);

  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const userEmail = c.get("userEmail");
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) return c.json({ error: "User not found" }, 404);

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({ email: userEmail, metadata: { userId } });
      customerId = customer.id;
      await db.update(schema.users).set({ stripeCustomerId: customerId }).where(eq(schema.users.id, userId));
    } catch (err) {
      Sentry.captureException(err, { tags: { route: "billing/checkout", step: "create_customer" } });
      return c.json({ error: "Could not create billing customer. Please try again." }, 502);
    }
  }

  Sentry.addBreadcrumb({ category: "billing", message: "stripe.checkout.sessions.create", data: { userId, customerId, tier }, level: "info" });
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${c.env.APP_URL}/dashboard?checkout=success&tier=${tier}`,
      cancel_url: `${c.env.APP_URL}/dashboard?checkout=cancel`,
      allow_promotion_codes: true,
      client_reference_id: userId,
      metadata: { tier },
      subscription_data: { metadata: { tier } },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "billing/checkout", step: "create_session" } });
    return c.json({ error: "Could not create checkout session. Please try again." }, 502);
  }

  if (!session.url) return c.json({ error: "Checkout session missing URL" }, 500);
  return c.json({ url: session.url });
});

app.post("/portal", requireAuth, async (c) => {
  const stripe = getStripe(c.env);
  if (!stripe) return c.json({ error: "Billing not configured" }, 503);
  const db = getDb(c.env.DB);
  const userId = c.get("userId");
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user?.stripeCustomerId) return c.json({ error: "No customer" }, 404);
  Sentry.addBreadcrumb({ category: "billing", message: "stripe.billingPortal.sessions.create", data: { userId }, level: "info" });
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${c.env.APP_URL}/dashboard`,
    });
    return c.json({ url: session.url });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "billing/portal" } });
    return c.json({ error: "Could not open billing portal. Please try again." }, 502);
  }
});

app.post("/webhook", async (c) => {
  const stripe = getStripe(c.env);
  if (!stripe || !c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Webhook not configured" }, 503);
  }
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "Missing signature" }, 400);
  const body = await c.req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return c.json({ error: `Bad signature: ${(err as Error).message}` }, 400);
  }

  const db = getDb(c.env.DB);

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      const userId = s.client_reference_id;
      if (userId && typeof s.customer === "string" && typeof s.subscription === "string") {
        // Resolve price → plan so admin/portal-initiated upgrades land on the right tier.
        let plan: Plan = "pro";
        try {
          const sub = await stripe.subscriptions.retrieve(s.subscription, { expand: ["items.data.price"] });
          const priceId = sub.items.data[0]?.price?.id;
          plan = planForPriceId(c.env, priceId);
        } catch (err) {
          Sentry.captureException(err, { tags: { route: "billing/webhook", step: "resolve_price" } });
        }
        await db
          .update(schema.users)
          .set({
            plan,
            stripeCustomerId: s.customer,
            stripeSubscriptionId: s.subscription,
          })
          .where(eq(schema.users.id, userId));
      } else {
        Sentry.addBreadcrumb({
          category: "billing",
          message: "stripe.webhook.checkout_completed.missing_reference",
          data: { sessionId: s.id, client_reference_id: userId, customer: s.customer, subscription: s.subscription },
          level: "warning",
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const active = sub.status === "active" || sub.status === "trialing";
      const priceId = sub.items.data[0]?.price?.id;
      const u = await db.query.users.findFirst({
        where: eq(schema.users.stripeCustomerId, customerId),
      });
      if (u) {
        const nextPlan: Plan = active ? planForPriceId(c.env, priceId) : "free";
        await db
          .update(schema.users)
          .set({
            plan: nextPlan,
            stripeSubscriptionId: sub.id,
          })
          .where(eq(schema.users.id, u.id));
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const u = await db.query.users.findFirst({
        where: eq(schema.users.stripeCustomerId, customerId),
      });
      if (u) {
        await db
          .update(schema.users)
          .set({ plan: "free", stripeSubscriptionId: null })
          .where(eq(schema.users.id, u.id));
      }
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (!customerId) break;
      const u = await db.query.users.findFirst({
        where: eq(schema.users.stripeCustomerId, customerId),
      });
      if (u) {
        const updateBillingUrl = `${c.env.APP_URL}/account/billing`;
        await sendEmail(c.env, {
          userId: u.id,
          template: "payment-failed",
          dedupKey: `payment-failed:${inv.id}`,
          data: {
            invoice_id: inv.id,
            invoice_url: inv.hosted_invoice_url ?? updateBillingUrl,
            amount_due: ((inv.amount_due ?? 0) / 100).toFixed(2),
            currency: (inv.currency ?? "usd").toUpperCase(),
            plan_label: PLAN_LABELS[u.plan as Plan] ?? "your plan",
            attempt_count: inv.attempt_count ?? 1,
            next_attempt: inv.next_payment_attempt
              ? new Date(inv.next_payment_attempt * 1000).toUTCString()
              : null,
            update_billing_url: updateBillingUrl,
          },
        });
      }
      break;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const inv = event.data.object;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (!customerId) break;
      // Skip the very first invoice — that's the welcome flow's job, not renewal.
      if (inv.billing_reason && inv.billing_reason !== "subscription_cycle") break;
      const u = await db.query.users.findFirst({
        where: eq(schema.users.stripeCustomerId, customerId),
      });
      if (u) {
        const planPrice =
          u.plan === "unlimited" ? UNLIMITED_PRICE_USD : u.plan === "pro" ? PRO_PRICE_USD : 0;
        await sendEmail(c.env, {
          userId: u.id,
          template: "renewal-receipt",
          dedupKey: `renewal:${inv.id}`,
          data: {
            invoice_id: inv.id,
            invoice_number: inv.number ?? inv.id,
            invoice_url: inv.hosted_invoice_url ?? `${c.env.APP_URL}/account/billing`,
            amount_paid: ((inv.amount_paid ?? planPrice * 100) / 100).toFixed(2),
            currency: (inv.currency ?? "usd").toUpperCase(),
            period_start: inv.period_start
              ? new Date(inv.period_start * 1000).toUTCString()
              : null,
            period_end: inv.period_end ? new Date(inv.period_end * 1000).toUTCString() : null,
            plan_label: PLAN_LABELS[u.plan as Plan] ?? "your plan",
            billing_url: `${c.env.APP_URL}/account/billing`,
          },
        });
      }
      break;
    }
    default:
      Sentry.addBreadcrumb({
        category: "billing",
        message: `stripe.webhook.unhandled: ${event.type}`,
        level: "info",
      });
  }

  return c.json({ received: true });
});

export default app;
