import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { getSubscription, setStripeCustomerMapping } from "@/lib/storage";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const authSession = await getServerSession(authOptions);
    const userId = authSession?.user?.id;
    const email  = authSession?.user?.email || userId;
    const name   = authSession?.user?.name  || email;
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { planId } = await request.json();
    if (!planId) return NextResponse.json({ error: "planId requerido" }, { status: 400 });

    // Resolve priceId server-side from env vars
    const priceMap = {
      starter:    process.env.STRIPE_PRICE_STARTER,
      pro:        process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    };
    const priceId = priceMap[planId];
    if (!priceId) return NextResponse.json({ error: `Plan "${planId}" no tiene priceId configurado` }, { status: 400 });

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://botflow-eight.vercel.app";

    // Check if user already has a Stripe customer ID
    const sub = await getSubscription(userId);
    let customerId = sub?.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId, planId },
      });
      customerId = customer.id;
      await setStripeCustomerMapping(customerId, userId);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/planes?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/dashboard/planes?canceled=1`,
      metadata: { userId, planId },
      subscription_data: {
        metadata: { userId, planId },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
