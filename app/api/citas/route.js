import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("bot_id");

    let query = db().from("appointments").select("*").eq("user_id", userId);
    if (botId) query = query.eq("bot_id", botId);
    query = query.order("created_at", { ascending: false }).limit(500);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ appointments: data || [] });
  } catch (err) {
    console.error("GET /api/citas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await db().from("appointments").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/citas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
