import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendWhatsAppText(to, message, phoneId, token) {
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });
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

  // Get the appointment
  const { data: appt, error: fetchErr } = await db
    .from("appointments")
    .select("*, bots(phone_number_id)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !appt) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Update status (and optionally store cancel_reason in data)
  const updatedData = { ...(appt.data || {}) };
  if (status === "cancelada" && cancel_reason) {
    updatedData._cancel_reason = cancel_reason;
  }

  const { error: updateErr } = await db
    .from("appointments")
    .update({ status, data: updatedData })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 });
  }

  // Send WhatsApp notification to the user
  try {
    const { data: botConfig } = await db
      .from("bots")
      .select("phone_number_id, meta_access_token")
      .eq("id", appt.bot_id)
      .single();

    if (botConfig?.phone_number_id && botConfig?.meta_access_token) {
      const nombre = appt.data?.nombre_completo || appt.data?.nombre || appt.contact_name || "Cliente";
      let msg = "";

      if (status === "confirmada") {
        msg = `✅ *¡Cita Confirmada!*\n\nHola ${nombre}, tu cita ha sido *confirmada* exitosamente.`;
        if (appt.data?.fecha_deseada) msg += `\n📅 Fecha: ${appt.data.fecha_deseada}`;
        if (appt.data?.hora_deseada) msg += `\n🕐 Hora: ${appt.data.hora_deseada}`;
        msg += `\n\n¡Te esperamos! 😊`;
      } else if (status === "cancelada") {
        msg = `❌ *Cita Cancelada*\n\nHola ${nombre}, lamentablemente tu cita ha sido *cancelada*.`;
        if (cancel_reason) msg += `\n\n*Motivo:* ${cancel_reason}`;
        msg += `\n\nSi deseas reagendar, por favor contáctanos. 🙏`;
      } else if (status === "pendiente") {
        msg = `⏳ *Cita en revisión*\n\nHola ${nombre}, tu cita está siendo revisada. Te notificaremos pronto.`;
      }

      if (msg) {
        await sendWhatsAppText(appt.contact_phone || appt.from_phone, msg, botConfig.phone_number_id, botConfig.meta_access_token);
      }
    }
  } catch (notifErr) {
    console.error("WhatsApp notification error:", notifErr.message);
    // Don't fail the request — status was already updated
  }

  return Response.json({ success: true });
}
