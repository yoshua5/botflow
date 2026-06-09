import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await db()
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json({ appointments: data || [] });
  } catch (err) {
    console.error("GET /api/citas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await request.json();
    if (!id || !["pendiente","confirmada","cancelada"].includes(status))
      return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const { error } = await db().from("appointments").update({ status }).eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/citas:", err);
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
