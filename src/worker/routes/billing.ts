import { Hono } from "hono";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import * as Sentry from "@sentry/cloudflare";
import { getDb, schema } from "../db";
import { requireAuth } from "../middleware/auth";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const getStripe = (env: Env) => {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
};

app.post("/checkout", requireAuth, async (c) => {
  const stripe = getStripe(c.env);
  if (!stripe || !c.env.STRIPE_PRICE_ID_PRO) {
    return c.json({ error: "Billing not configured" }, 503);
  }
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

  Sentry.addBreadcrumb({ category: "billing", message: "stripe.checkout.sessions.create", data: { userId, customerId }, level: "info" });
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: c.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
      success_url: `${c.env.APP_URL}/dashboard?checkout=success`,
      cancel_url: `${c.env.APP_URL}/dashboard?checkout=cancel`,
      allow_promotion_codes: true,
      client_reference_id: userId,
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
        await db
          .update(schema.users)
          .set({
            plan: "pro",
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
      const u = await db.query.users.findFirst({
        where: eq(schema.users.stripeCustomerId, customerId),
      });
      if (u) {
        await db
          .update(schema.users)
          .set({
            plan: active ? "pro" : "free",
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
