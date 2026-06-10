
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = supabase();
    const { data: connect } = await db.from("stripe_connect_accounts")
      .select("*").eq("user_id", userId).single();

    if (!connect) return NextResponse.json({ connected: false });

    // Refresh from Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve(connect.stripe_account_id);

    // Update status in DB
    const status = account.charges_enabled ? "active"
      : account.details_submitted ? "restricted"
      : "pending";

    await db.from("stripe_connect_accounts").update({
      charges_enabled:  account.charges_enabled,
      payouts_enabled:  account.payouts_enabled,
      details_submitted: account.details_submitted,
      status,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return NextResponse.json({
      connected: true,
      accountId: connect.stripe_account_id,
      status,
      chargesEnabled:   account.charges_enabled,
      payoutsEnabled:   account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email:            account.email,
    });
  } catch (err) {
    console.error("Connect status error:", err.message);
    return NextResponse.json({ connected: false, error: err.message });
  }
}
