
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const sig  = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Connect webhook sig error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = supabase();

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object;
        const status = account.charges_enabled ? "active"
          : account.details_submitted ? "restricted"
          : "pending";
        await db.from("stripe_connect_accounts").update({
          charges_enabled:   account.charges_enabled,
          payouts_enabled:   account.payouts_enabled,
          details_submitted: account.details_submitted,
          status,
          updated_at: new Date().toISOString(),
        }).eq("stripe_account_id", account.id);
        console.log("Connect account updated:", account.id, status);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, itemId, customerPhone, customerName } = session.metadata || {};
        if (!userId) break;

        // Update order status
        await db.from("catalog_orders").update({
          status: "paid",
          stripe_payment_intent: session.payment_intent,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("stripe_session_id", session.id);

        // Send WhatsApp notifications
        if (customerPhone) {
          const { data: item } = await db.from("catalog_items")
            .select("name, price, currency").eq("id", itemId).single();
          if (item) {
            await sendPaymentNotification(userId, customerPhone, item, customerName, db);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        await db.from("catalog_orders").update({
          status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("stripe_payment_intent", pi.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        await db.from("catalog_orders").update({
          status: "refunded",
          updated_at: new Date().toISOString(),
        }).eq("stripe_payment_intent", charge.payment_intent);
        break;
      }
    }
  } catch (err) {
    console.error("Connect webhook handler error:", err.message);
  }

  return NextResponse.json({ received: true });
}

async function sendPaymentNotification(userId, customerPhone, item, customerName, db) {
  try {
    const { data: connect } = await db.from("stripe_connect_accounts")
      .select("email").eq("user_id", userId).single();

    const token   = process.env.WA_ACCESS_TOKEN;
    const phoneId = process.env.WA_PHONE_NUMBER_ID;
    if (!token || !phoneId) return;

    const price = item.price ? `${item.price.toFixed(2)} ${item.currency}` : "";

    // Notify customer
    const custMsg = `Hola ${customerName || ""}! Tu pago fue procesado exitosamente. *${item.name}* ${price ? "- " + price : ""}. Gracias por tu compra!`;
    const clean = customerPhone.replace(/[^0-9]/g, "");
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to: clean, type: "text", text: { body: custMsg } }),
    });

    // Log
    await db.from("payment_notifications").insert([
      { order_id: null, user_id: userId, recipient: "customer", phone: customerPhone, message: custMsg, status: "sent" },
    ]);
  } catch (err) {
    console.error("Payment notification error:", err.message);
  }
}
