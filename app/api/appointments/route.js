import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getConfig } from "@/lib/storage";
import { getSheetRows, deleteSheetRow, updateSheetCell, setupSheetHeaders } from "@/lib/google";
import { bookAppointment } from "@/lib/bookAppointment";

// GET — read all appointments from Google Sheets
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const config       = await getConfig();
    const appointments = config.appointments || {};

    if (!appointments.sheetsId || !appointments.googleCredentials) {
      return NextResponse.json({ rows: [], headers: [], error: "Sheets no configurado" });
    }

    const tab    = appointments.sheetsTab || "Citas";
    const result = await getSheetRows(appointments.googleCredentials, appointments.sheetsId, tab);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Appointments GET error:", err);
    return NextResponse.json({ rows: [], headers: [], error: err.message }, { status: 500 });
  }
}

// POST — book a new appointment
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { data, from } = await request.json();
    if (!data) return NextResponse.json({ error: "No data" }, { status: 400 });

    const config       = await getConfig();
    const appointments = config.appointments || {};

    if (!appointments.enabled) {
      return NextResponse.json({ error: "Appointments disabled" }, { status: 400 });
    }

    const waConfig = { accessToken: config.accessToken, phoneNumberId: config.phoneNumberId };
    const { results, nombre, startDT, endDT } = await bookAppointment(data, from, appointments, waConfig);
    return NextResponse.json({ success: true, results, nombre, startDT, endDT });
  } catch (err) {
    console.error("Appointment API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — update appointment status (Pendiente → Confirmada / Cancelada)
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { rowIndex, status } = await request.json();
    if (!rowIndex || !status) return NextResponse.json({ error: "rowIndex y status son requeridos" }, { status: 400 });

    const config       = await getConfig();
    const appointments = config.appointments || {};

    if (!appointments.sheetsId || !appointments.googleCredentials) {
      return NextResponse.json({ error: "Sheets no configurado" }, { status: 400 });
    }

    const tab = appointments.sheetsTab || "Citas";
    const { headers } = await getSheetRows(appointments.googleCredentials, appointments.sheetsId, tab);
    let estadoIdx = headers.indexOf("Estado");

    // If Estado column doesn't exist yet, add it at the end
    if (estadoIdx === -1) {
      await setupSheetHeaders(appointments.googleCredentials, appointments.sheetsId, tab, [...headers, "Estado"]);
      estadoIdx = headers.length;
    }

    await updateSheetCell(appointments.googleCredentials, appointments.sheetsId, tab, rowIndex, estadoIdx, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Appointment PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove an appointment row
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { rowIndex } = await request.json();
    if (!rowIndex) return NextResponse.json({ error: "rowIndex es requerido" }, { status: 400 });

    const config       = await getConfig();
    const appointments = config.appointments || {};

    if (!appointments.sheetsId || !appointments.googleCredentials) {
      return NextResponse.json({ error: "Sheets no configurado" }, { status: 400 });
    }

    const tab = appointments.sheetsTab || "Citas";
    await deleteSheetRow(appointments.googleCredentials, appointments.sheetsId, tab, rowIndex);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Appointment DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — setup/repair sheet headers
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const config       = await getConfig();
    const appointments = config.appointments || {};

    if (!appointments.sheetsId || !appointments.googleCredentials) {
      return NextResponse.json({ error: "Sheets no configurado" }, { status: 400 });
    }

    const fields  = appointments.fields || [];
    const tab     = appointments.sheetsTab || "Citas";
    const headers = fields.map(f => f.label).concat(["WhatsApp", "Fecha de registro", "Estado"]);

    await setupSheetHeaders(appointments.googleCredentials, appointments.sheetsId, tab, headers);
    return NextResponse.json({ success: true, headers });
  } catch (err) {
    console.error("Appointment PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
