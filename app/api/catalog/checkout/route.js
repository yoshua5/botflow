
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

// Public endpoint  called from WhatsApp bot context, not authenticated session.
// Receives userId (seller) + itemId from the bot.
export async function POST(req) {
  try {
    const { userId, itemId, customerPhone, customerName, successUrl, cancelUrl } = await req.json();
    if (!userId || !itemId) return NextResponse.json({ error: "userId and itemId required" }, { status: 400 });

    const db = supabase();

    // Get catalog item
    const { data: item } = await db.from("catalog_items")
      .select("*").eq("id", itemId).eq("user_id", userId).single();
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (!item.price) return NextResponse.json({ error: "Item has no price" }, { status: 400 });

    // Get seller Stripe Connect account
    const { data: connect } = await db.from("stripe_connect_accounts")
      .select("*").eq("user_id", userId).single();
    if (!connect?.charges_enabled) {
      return NextResponse.json({ error: "Seller has not completed payment setup" }, { status: 400 });
    }

    // Get platform commission
    const { data: commission } = await db.from("platform_commission")
      .select("*").limit(1).single();

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const amountCents = Math.round(item.price * 100);
    let applicationFeeAmount = 0;
    if (commission?.enabled) {
      if (commission.mode === "percentage" || commission.mode === "both") {
        applicationFeeAmount += Math.round(amountCents * (commission.percentage / 100));
      }
      if (commission.mode === "fixed" || commission.mode === "both") {
        applicationFeeAmount += Math.round(commission.fixed_amount * 100);
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://botflow-eight.vercel.app";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: (item.currency || "mxn").toLowerCase(),
          unit_amount: amountCents,
          product_data: {
            name: item.name,
            description: item.description || undefined,
            images: (item.images || []).slice(0,8).map(i => i.url).filter(Boolean),
          },
        },
        quantity: 1,
      }],
      success_url: successUrl || `${origin}/pago/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl  || `${origin}/pago/cancelado`,
      metadata: { userId, itemId, customerPhone: customerPhone || "", customerName: customerName || "" },
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount || undefined,
        transfer_data: { destination: connect.stripe_account_id },
        metadata: { userId, itemId, customerPhone: customerPhone || "" },
      },
    }, { stripeAccount: undefined }); // use platform key, funds go to connected account

    // Create pending order record
    await db.from("catalog_orders").insert({
      user_id: userId,
      catalog_item_id: itemId,
      customer_phone: customerPhone || null,
      customer_name: customerName || null,
      quantity: 1,
      unit_price: item.price,
      total_amount: item.price,
      currency: item.currency || "MXN",
      status: "pending",
      stripe_session_id: session.id,
      platform_fee: applicationFeeAmount / 100,
      seller_payout: (amountCents - applicationFeeAmount) / 100,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Catalog checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
