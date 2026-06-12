
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = supabase();
    const body = await req.json().catch(() => ({}));
    const botId = body.bot_id || null;
    let scq = db.from("stripe_connect_accounts").select("stripe_account_id").eq("user_id", userId);
    if (botId) scq = scq.eq("bot_id", botId); else scq = scq.is("bot_id", null);
    const { data: connect } = await scq.single();
    if (!connect) return NextResponse.json({ error: "No connected account" }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const loginLink = await stripe.accounts.createLoginLink(connect.stripe_account_id);
    return NextResponse.json({ url: loginLink.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
