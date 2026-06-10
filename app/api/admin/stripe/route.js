import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  let accountInfo = null;

  if (hasStripe) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const balance = await stripe.balance.retrieve();
      const account = await stripe.accounts.retrieve();
      accountInfo = {
        id: account.id,
        email: account.email,
        country: account.country,
        currency: account.default_currency,
        availableBalance: balance.available?.map(b => ({ amount: b.amount / 100, currency: b.currency })) || [],
        pendingBalance: balance.pending?.map(b => ({ amount: b.amount / 100, currency: b.currency })) || [],
      };
    } catch (e) {
      console.error("Stripe error:", e.message);
    }
  }

  return NextResponse.json({ connected: hasStripe, account: accountInfo });
}
