import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function sendWAText(to, body, phoneId, token) {
  const r = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
  if (!r.ok) {
    const e = await r.text();
    console.error("WA send error:", e);
    return { ok: false, error: e };
  }
  return { ok: true };
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "No user id" }, { status: 401 });

  const { id } = params;
  const { status, cancel_reason } = await req.json();

  const validStatuses = ["pendiente", "confirmada", "cancelada"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = db();

  // Get appointment
  const { data: appt, error: fetchErr } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !appt) {
    console.error("Appointment fetch error:", fetchErr?.message);
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Update status + optionally store cancellation reason
  const updatedData = { ...(appt.data || {}) };
  if (status === "cancelada" && cancel_reason) updatedData._cancel_reason = cancel_reason;

  const { error: updateErr } = await supabase
    .from("appointments")
    .update({ status, data: updatedData })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

  // Send WhatsApp notification
  let notifResult = { sent: false, reason: "no_attempt" };
  try {
    let phoneId = null, accessToken = null;

    const botId = appt.bot_id;
    if (botId) {
      const { data: bot } = await supabase.from("bots").select("phone_number_id").eq("id", botId).single();
      const { data: sec } = await supabase.from("bot_secrets").select("access_token_enc").eq("bot_id", botId).single();
      phoneId = bot?.phone_number_id;
      const decrypted = sec?.access_token_enc ? decrypt(sec.access_token_enc) : null;
      accessToken = decrypted && decrypted.length > 30 ? decrypted : null;
      if (decrypted && decrypted.length <= 30) {
        console.warn(`[citas PATCH] bot ${botId}: decrypted token too short (${decrypted.length} chars) — likely invalid`);
      }
    }

    // Fallback: first active bot for this user
    if (!phoneId || !accessToken) {
      const { data: bots } = await supabase.from("bots").select("id, phone_number_id").eq("user_id", userId).limit(1);
      const firstBot = bots?.[0];
      if (firstBot) {
        phoneId = phoneId || firstBot.phone_number_id;
        if (!accessToken) {
          const { data: sec } = await supabase.from("bot_secrets").select("access_token_enc").eq("bot_id", firstBot.id).single();
          const decrypted = sec?.access_token_enc ? decrypt(sec.access_token_enc) : null;
          accessToken = decrypted && decrypted.length > 30 ? decrypted : null;
          if (decrypted && decrypted.length <= 30) {
            console.warn(`[citas PATCH] fallback bot ${firstBot.id}: decrypted token too short (${decrypted.length} chars)`);
          }
        }
      }
    }

    // Also try env var override
    if (!accessToken && process.env.WA_ACCESS_TOKEN) {
      accessToken = process.env.WA_ACCESS_TOKEN;
      console.log("[citas PATCH] using WA_ACCESS_TOKEN env var");
    }
    if (!phoneId && process.env.WA_PHONE_NUMBER_ID) {
      phoneId = process.env.WA_PHONE_NUMBER_ID;
    }

    const to = appt.from_phone;
    const nombre = appt.data?.nombre_completo || appt.data?.nombre || appt.contact_name || "Cliente";

    console.log(`[citas PATCH] status=${status} phoneId=${phoneId} tokenLen=${accessToken?.length ?? 0} to=${to}`);

    if (phoneId && accessToken && to) {
      let msg = "";
      if (status === "confirmada") {
        msg = `✅ *¡Cita Confirmada!*\n\nHola ${nombre}, tu cita ha sido *confirmada* exitosamente.`;
        if (appt.data?.fecha_deseada) msg += `\n📅 Fecha: ${appt.data.fecha_deseada}`;
        if (appt.data?.hora_deseada)  msg += `\n🕐 Hora: ${appt.data.hora_deseada}`;
        msg += `\n\n¡Te esperamos! 😊`;
      } else if (status === "cancelada") {
        msg = `❌ *Cita Cancelada*\n\nHola ${nombre}, tu cita ha sido *cancelada*.`;
        if (cancel_reason) msg += `\n\n*Motivo:* ${cancel_reason}`;
        msg += `\n\nSi deseas reagendar, contáctanos. 🙏`;
      } else if (status === "pendiente") {
        msg = `⏳ *Cita en revisión*\n\nHola ${nombre}, tu cita está siendo revisada. Te notificaremos pronto.`;
      }
      if (msg) {
        const waResult = await sendWAText(to, msg, phoneId, accessToken);
        notifResult = waResult.ok
          ? { sent: true }
          : { sent: false, reason: "wa_error", error: waResult.error };
      } else {
        notifResult = { sent: false, reason: "no_message_for_status" };
      }
    } else {
      const missing = [];
      if (!phoneId) missing.push("phoneId");
      if (!accessToken) missing.push("accessToken");
      if (!to) missing.push("to (from_phone)");
      notifResult = { sent: false, reason: "missing_credentials", missing };
      console.warn("[citas PATCH] Missing for notification:", missing.join(", "));
    }
  } catch (e) {
    console.error("Notification error:", e.message);
    notifResult = { sent: false, reason: "exception", error: e.message };
  }

  return Response.json({ success: true, notification: notifResult });
}
