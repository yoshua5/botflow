import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Stripe from "stripe";
import { getSubscription } from "@/lib/storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const sub = await getSubscription(userId);
    const customerId = sub?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: "No tienes una suscripción activa" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "https://botflow-eight.vercel.app";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/planes`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
