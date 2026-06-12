
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const email  = session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const botId = body.bot_id || null;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const db = supabase();
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://botflow-eight.vercel.app";

    // Check if account already exists
    let scq = db.from("stripe_connect_accounts").select("*").eq("user_id", userId);
    if (botId) scq = scq.eq("bot_id", botId); else scq = scq.is("bot_id", null);
    let { data: existing } = await scq.single();

    let accountId;
    if (existing?.stripe_account_id) {
      accountId = existing.stripe_account_id;
    } else {
      // Create new Express account
      const account = await stripe.accounts.create({
        type: "express",
        country: "MX",
        email: email || undefined,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "individual",
        metadata: { userId },
      });
      accountId = account.id;

      await db.from("stripe_connect_accounts").insert({
        user_id: userId,
        bot_id: botId,
        stripe_account_id: accountId,
        status: "pending",
        email: email || null,
      });
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/pagos?refresh=1`,
      return_url:  `${origin}/dashboard/pagos?connected=1`,
      type: "account_onboarding",
    });

    // Save onboarding URL
    let upd = db.from("stripe_connect_accounts")
      .update({ onboarding_url: accountLink.url, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (botId) upd = upd.eq("bot_id", botId); else upd = upd.is("bot_id", null);
    await upd;

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Connect onboard error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
