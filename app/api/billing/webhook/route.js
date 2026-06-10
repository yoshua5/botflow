import { NextResponse } from "next/server";
import { setSubscription, getUserIdByStripeCustomer } from "@/lib/storage";

export const config = { api: { bodyParser: false } };

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = await getUserIdByStripeCustomer(sub.customer);
        if (userId) {
          const planMap = {
            [process.env.STRIPE_PRICE_STARTER]: "starter",
            [process.env.STRIPE_PRICE_PRO]:     "pro",
            [process.env.STRIPE_PRICE_ENTERPRISE]: "enterprise",
          };
          const plan = planMap[sub.items.data[0]?.price?.id] || "free";
          await setSubscription({
            plan,
            status:               sub.status,
            stripeCustomerId:     sub.customer,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd:     new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd:    sub.cancel_at_period_end,
          }, userId);
          console.log(`✅ Subscription ${event.type} for user ${userId}: plan=${plan}, status=${sub.status}`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = await getUserIdByStripeCustomer(sub.customer);
        if (userId) {
          await setSubscription({ plan: "free", status: "canceled", stripeCustomerId: sub.customer, stripeSubscriptionId: sub.id }, userId);
          console.log(`✅ Subscription canceled for user ${userId}`);
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object;
        const userId = await getUserIdByStripeCustomer(inv.customer);
        if (userId) {
          await setSubscription({ plan: inv.metadata?.plan || "free", status: "active", stripeCustomerId: inv.customer, lastInvoiceDate: new Date().toISOString(), lastInvoiceAmount: inv.amount_paid / 100 }, userId);
          console.log(`✅ Payment succeeded for user ${userId}: $${inv.amount_paid / 100}`);
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object;
        const userId = await getUserIdByStripeCustomer(inv.customer);
        if (userId) {
          await setSubscription({ status: "past_due", stripeCustomerId: inv.customer }, userId);
          console.log(`⚠️ Payment failed for user ${userId}`);
        }
        break;
      }
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  return NextResponse.json({ received: true });
}
