import { NextResponse } from "next/server";
import { getConfig } from "@/lib/storage";

// Public endpoint — returns only the info needed to render the booking calendar
// Never exposes API keys or credentials
export async function GET() {
  try {
    const config = await getConfig();
    const apt = config.appointments || {};

    if (!apt.enabled) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      businessName: config.businessName || config.agentName || "Botflow",
      fields: apt.fields || [],
      workDays: apt.workDays || [1, 2, 3, 4, 5],
      startHour: apt.startHour ?? 9,
      endHour: apt.endHour ?? 18,
      slotMinutes: apt.slotMinutes ?? 60,
      reminderMinutes: apt.reminderMinutes ?? null,
      hasCalendar: !!(apt.calendarId && apt.googleCredentials),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
