
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = supabase();
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get("bot_id");
    let scq = db.from("stripe_connect_accounts").select("*").eq("user_id", userId);
    if (botId) scq = scq.eq("bot_id", botId); else scq = scq.is("bot_id", null);
    const { data: connect } = await scq.single();

    if (!connect) return NextResponse.json({ connected: false });

    // Refresh from Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve(connect.stripe_account_id);

    // Update status in DB
    const status = account.charges_enabled ? "active"
      : account.details_submitted ? "restricted"
      : "pending";

    let uq = db.from("stripe_connect_accounts").update({
      charges_enabled:  account.charges_enabled,
      payouts_enabled:  account.payouts_enabled,
      details_submitted: account.details_submitted,
      status,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    if (botId) uq = uq.eq("bot_id", botId); else uq = uq.is("bot_id", null);
    await uq;

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
