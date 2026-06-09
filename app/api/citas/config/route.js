import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const DEFAULTS = { available_days: [1,2,3,4,5], start_time: "09:00", end_time: "18:00", slot_minutes: 60, notes: "" };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data } = await db().from("appointment_config").select("*").eq("user_id", userId).maybeSingle();
    return NextResponse.json({ config: data || DEFAULTS });
  } catch (err) {
    return NextResponse.json({ config: DEFAULTS });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { error } = await db().from("appointment_config").upsert(
      { user_id: userId, ...body, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/citas/config:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
