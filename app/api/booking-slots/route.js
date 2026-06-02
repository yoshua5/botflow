import { NextResponse } from "next/server";
import { getConfig } from "@/lib/storage";
import { getAvailableSlots } from "@/lib/google";

// GET /api/booking-slots?month=2026-06
// Returns available slot dates and times for a given month
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // "2026-06"

    const config = await getConfig();
    const apt = config.appointments || {};

    if (!apt.enabled) {
      return NextResponse.json({ error: "Citas no habilitadas" }, { status: 400 });
    }

    const slotMinutes = apt.slotDuration ?? apt.slotMinutes ?? 60;
    const weeklySlots = apt.weeklySlots || null; // new visual grid format

    // Fallback: derive from old workDays/startHour/endHour
    const parseHour = (v, def) => {
      if (!v) return def;
      if (typeof v === "number") return v;
      const [h] = String(v).split(":").map(Number);
      return isNaN(h) ? def : h;
    };
    const startHour = parseHour(apt.startHour, 9);
    const endHour   = parseHour(apt.endHour, 18);
    const workDays  = apt.workDays || [1, 2, 3, 4, 5];

    // Parse target month, default to current
    const now = new Date();
    let year  = now.getFullYear();
    let mon   = now.getMonth(); // 0-based
    if (month) {
      const [y, m] = month.split("-").map(Number);
      if (y && m) { year = y; mon = m - 1; }
    }

    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build structured available slots
    const availableByDate = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, mon, d);
      const dow  = date.getDay(); // 0=Sun...6=Sat
      if (date < today) continue;

      const dateStr = date.toISOString().slice(0, 10);
      let slots = [];

      if (weeklySlots) {
        // Use visual grid — weeklySlots[dow] is array of "HH:MM" strings
        slots = weeklySlots[dow] || weeklySlots[String(dow)] || [];
      } else {
        // Fallback: classic workDays + startHour + endHour
        if (!workDays.includes(dow)) continue;
        const totalMins = (endHour - startHour) * 60;
        for (let m = 0; m < totalMins; m += slotMinutes) {
          const h  = startHour + Math.floor(m / 60);
          const mm = m % 60;
          slots.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
        }
      }

      if (slots.length > 0) availableByDate[dateStr] = slots;
    }

    return NextResponse.json({ availableByDate, slotMinutes });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
