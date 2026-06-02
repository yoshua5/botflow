/**
 * bookAppointment.js — Shared appointment booking logic
 * Called directly from the webhook (no HTTP roundtrip) and from /api/appointments
 */
import {
  createCalendarEvent,
  appendToSheet,
  invalidateSlotsCache,
} from "./google.js";

export async function bookAppointment(data, from, appointments, waConfig = {}) {
  const fields  = appointments.fields || [];
  const results = { calendar: null, sheets: null, whatsapp: null };
  const now     = new Date();

  // ── Parse date/time ──────────────────────────────────────
  const fechaRaw = data.fecha_preferida || data.fecha || "";
  const horaRaw  = data.hora_preferida  || data.hora  || "10:00";

  let startDT = new Date(now);
  startDT.setDate(startDT.getDate() + 1);
  startDT.setHours(10, 0, 0, 0);

  if (fechaRaw) {
    const isoMatch   = fechaRaw.match(/(\d{4})-(\d{2})-(\d{2})/);
    const slashMatch = fechaRaw.match(/(\d{1,2})[/\-](\d{1,2})/);
    const lowerFecha = fechaRaw.toLowerCase().trim();
    const naturalDays = { "hoy": 0, "mañana": 1, "pasado mañana": 2, "pasado": 2 };

    if (isoMatch) {
      startDT = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    } else if (slashMatch) {
      startDT = new Date(now.getFullYear(), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
    } else if (naturalDays[lowerFecha] !== undefined) {
      startDT = new Date(now);
      startDT.setDate(startDT.getDate() + naturalDays[lowerFecha]);
    } else {
      const spanishMonths = {
        enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
        julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12,
      };
      const monthMatch = lowerFecha.match(/(\d{1,2})\s+(?:de\s+)?(\w+)/);
      if (monthMatch) {
        const day   = Number(monthMatch[1]);
        const month = spanishMonths[monthMatch[2]];
        if (month) {
          startDT = new Date(now.getFullYear(), month - 1, day);
          if (startDT < now) startDT.setFullYear(now.getFullYear() + 1);
        }
      }
    }
  }

  if (horaRaw) {
    const timeMatch = horaRaw.match(/(\d{1,2}):?(\d{2})?/);
    if (timeMatch) {
      startDT.setHours(Number(timeMatch[1]), Number(timeMatch[2] || 0), 0, 0);
    }
  }

  const endDT  = new Date(startDT);
  endDT.setMinutes(endDT.getMinutes() + Number(appointments.slotDuration || 60));
  const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ") || "Cliente";

  // ── Google Calendar ──────────────────────────────────────
  if (appointments.calendarId && appointments.googleCredentials) {
    try {
      const tz  = appointments.timezone || "America/Mexico_City";
      const desc = fields
        .map(f => `${f.label}: ${data[f.key] || "—"}`)
        .concat([`WhatsApp: ${from || "—"}`, `Agendado: ${now.toLocaleString("es-MX")}`])
        .join("\n");

      const event = await createCalendarEvent(
        appointments.googleCredentials,
        appointments.calendarId,
        {
          summary:     `📅 Cita — ${nombre}`,
          description: desc,
          start: { dateTime: startDT.toISOString(), timeZone: tz },
          end:   { dateTime: endDT.toISOString(),   timeZone: tz },
        }
      );

      if (event.id) {
        results.calendar = "ok";
        console.log(`📅 Calendar event created: ${event.id} for ${nombre}`);
        invalidateSlotsCache();
      } else {
        results.calendar = "error";
        console.error("❌ Calendar event error:", JSON.stringify(event));
      }
    } catch (err) {
      console.error("❌ Calendar booking error:", err.message);
      results.calendar = "error";
    }
  }

  // ── Google Sheets ────────────────────────────────────────
  if (appointments.sheetsId && appointments.googleCredentials) {
    try {
      const tab     = appointments.sheetsTab || "Citas";
      // Include "Estado" column for filtering in dashboard
      const headers = fields.map(f => f.label).concat(["WhatsApp", "Fecha de registro", "Estado"]);
      const values  = fields.map(f => data[f.key] || "").concat([from || "", now.toLocaleString("es-MX"), "Pendiente"]);

      await appendToSheet(appointments.googleCredentials, appointments.sheetsId, tab, values);
      results.sheets = "ok";
      console.log(`📊 Sheets row appended for ${nombre}`);
    } catch (err) {
      console.error("❌ Sheets error:", err.message);
      results.sheets = "error";
    }
  }

  // ── WhatsApp confirmation to client ─────────────────────
  if (from && waConfig?.accessToken && waConfig?.phoneNumberId) {
    try {
      const tz      = appointments.timezone || "America/Mexico_City";
      const dateStr = startDT.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: tz });
      const timeStr = startDT.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: tz });
      const businessName = appointments.businessName || "";

      // Build reminder note
      const reminderMinutes = appointments.reminderMinutes || 0;
      let reminderNote = "";
      if (reminderMinutes > 0) {
        let rLabel = "";
        if (reminderMinutes < 60)        rLabel = `${reminderMinutes} minutos`;
        else if (reminderMinutes === 60)  rLabel = "1 hora";
        else if (reminderMinutes < 1440) rLabel = `${reminderMinutes / 60} horas`;
        else if (reminderMinutes === 1440) rLabel = "24 horas (1 día)";
        else rLabel = `${reminderMinutes / 1440} días`;
        reminderNote = `\n⏰ *Recordatorio:* Te avisaremos ${rLabel} antes de tu cita.`;
      }

      const msg = `✅ *¡Cita confirmada${nombre !== "Cliente" ? `, ${nombre}` : ""}!*\n\n📅 *Fecha:* ${dateStr}\n⏰ *Hora:* ${timeStr}${reminderNote}\n\n_Si necesitas cambiar o cancelar tu cita, escríbenos aquí._ 🙏`;

      const waRes = await fetch(
        `https://graph.facebook.com/v19.0/${waConfig.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${waConfig.accessToken}` },
          body: JSON.stringify({ messaging_product: "whatsapp", to: from, type: "text", text: { body: msg } }),
        }
      );
      const waData = await waRes.json();
      if (waData.messages?.[0]?.id) {
        results.whatsapp = "ok";
        console.log(`📱 WhatsApp confirmation sent to ${from}`);
      } else {
        results.whatsapp = "error";
        console.error("❌ WhatsApp confirmation error:", JSON.stringify(waData));
      }
    } catch (err) {
      console.error("❌ WhatsApp confirmation error:", err.message);
      results.whatsapp = "error";
    }
  }

  return { results, nombre, startDT: startDT.toISOString(), endDT: endDT.toISOString() };
}
