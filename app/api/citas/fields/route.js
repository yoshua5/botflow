import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// GET: list all fields for this user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await db()
      .from("appointment_fields")
      .select("*")
      .eq("user_id", userId)
      .order("field_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ fields: getDefaultFields() });
    return NextResponse.json({ fields: data });
  } catch (err) {
    console.error("GET /api/citas/fields:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: save full field list (replace all)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fields } = await request.json();
    if (!Array.isArray(fields)) return NextResponse.json({ error: "fields must be array" }, { status: 400 });

    const supabase = db();
    await supabase.from("appointment_fields").delete().eq("user_id", userId);

    if (fields.length > 0) {
      const rows = fields.map((f, i) => ({
        user_id:     userId,
        field_key:   f.field_key || `field_${i}`,
        field_label: f.field_label || `Campo ${i + 1}`,
        question:    f.question   || `¿Cuál es tu ${f.field_label || "dato"}?`,
        field_order: i,
        required:    f.required !== false,
      }));
      const { error } = await supabase.from("appointment_fields").insert(rows);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/citas/fields:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getDefaultFields() {
  return [
    { id: "d1", field_key: "nombre",   field_label: "Nombre completo",   question: "¿Cuál es tu nombre completo?",          field_order: 0, required: true },
    { id: "d2", field_key: "telefono", field_label: "Teléfono",          question: "¿Cuál es tu número de teléfono?",       field_order: 1, required: true },
    { id: "d3", field_key: "fecha",    field_label: "Fecha deseada",     question: "¿Qué fecha te gustaría para la cita?",  field_order: 2, required: true },
    { id: "d4", field_key: "hora",     field_label: "Hora deseada",      question: "¿A qué hora prefieres?",               field_order: 3, required: true },
    { id: "d5", field_key: "motivo",   field_label: "Motivo de la cita", question: "¿Cuál es el motivo de la cita?",       field_order: 4, required: false },
  ];
}
