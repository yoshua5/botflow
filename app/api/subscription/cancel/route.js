import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubscription } from "@/lib/storage";
import Stripe from "stripe";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const sub = await getSubscription(session.user.id);
    if (!sub?.stripeSubscriptionId) return Response.json({ error: "No active subscription" }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });

    return Response.json({ success: true });
  } catch (e) {
    console.error("Cancel subscription error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
