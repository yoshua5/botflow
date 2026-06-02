import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getSubscription, setSubscription,
  getUserIdByStripeCustomer, setStripeCustomerMapping,
} from "@/lib/storage";
import { getPlanByPriceId } from "@/lib/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.text();
  const sig  = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId  = session.metadata?.userId;
        if (!userId) break;

        const subscriptionId = session.subscription;
        const customerId     = session.customer;

        await setStripeCustomerMapping(customerId, userId);

        // Fetch subscription details
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId   = stripeSub.items.data[0]?.price?.id;
        const plan      = getPlanByPriceId(priceId);

        const subData = {
          stripeCustomerId:     customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId:        priceId,
          planId:               plan?.id || "starter",
          planName:             plan?.name || "Starter",
          status:               "active",
          currentPeriodStart:   new Date(stripeSub.current_period_start * 1000).toISOString(),
          currentPeriodEnd:     new Date(stripeSub.current_period_end   * 1000).toISOString(),
          cancelAtPeriodEnd:    stripeSub.cancel_at_period_end,
          amount:               plan?.price || 0,
          currency:             "usd",
          lastEvent:            "checkout.session.completed",
          updatedAt:            new Date().toISOString(),
        };

        await setSubscription(subData, userId);
        console.log(`✅ Subscription activated for user ${userId}: ${plan?.name}`);
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub  = event.data.object;
        const customerId = stripeSub.customer;
        const userId     = await getUserIdByStripeCustomer(customerId);
        if (!userId) break;

        const priceId = stripeSub.items.data[0]?.price?.id;
        const plan    = getPlanByPriceId(priceId);

        const existing = await getSubscription(userId) || {};
        await setSubscription({
          ...existing,
          stripePriceId:      priceId,
          planId:             plan?.id || existing.planId,
          planName:           plan?.name || existing.planName,
          status:             stripeSub.status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000).toISOString(),
          currentPeriodEnd:   new Date(stripeSub.current_period_end   * 1000).toISOString(),
          cancelAtPeriodEnd:  stripeSub.cancel_at_period_end,
          amount:             plan?.price || existing.amount,
          lastEvent:          "customer.subscription.updated",
          updatedAt:          new Date().toISOString(),
        }, userId);

        console.log(`🔄 Subscription updated for user ${userId}: ${plan?.name || "unknown"} — status: ${stripeSub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub  = event.data.object;
        const customerId = stripeSub.customer;
        const userId     = await getUserIdByStripeCustomer(customerId);
        if (!userId) break;

        const existing = await getSubscription(userId) || {};
        await setSubscription({
          ...existing,
          planId:    "free",
          planName:  "Free",
          status:    "canceled",
          canceledAt: new Date().toISOString(),
          lastEvent:  "customer.subscription.deleted",
          updatedAt:  new Date().toISOString(),
        }, userId);

        console.log(`❌ Subscription canceled for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice    = event.data.object;
        const customerId = invoice.customer;
        const userId     = await getUserIdByStripeCustomer(customerId);
        if (!userId) break;

        const existing = await getSubscription(userId) || {};
        await setSubscription({
          ...existing,
          status:    "active",
          lastInvoiceId:     invoice.id,
          lastInvoiceAmount: invoice.amount_paid / 100,
          lastInvoiceDate:   new Date(invoice.created * 1000).toISOString(),
          lastEvent:         "invoice.payment_succeeded",
          updatedAt:         new Date().toISOString(),
        }, userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice    = event.data.object;
        const customerId = invoice.customer;
        const userId     = await getUserIdByStripeCustomer(customerId);
        if (!userId) break;

        const existing = await getSubscription(userId) || {};
        await setSubscription({
          ...existing,
          status:    "past_due",
          lastEvent: "invoice.payment_failed",
          updatedAt: new Date().toISOString(),
        }, userId);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err.message);
  }

  return NextResponse.json({ received: true });
}
