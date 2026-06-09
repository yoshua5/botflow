import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getUserId(req) {
  const session = await getServerSession(authOptions);
  return session?.user?.id || session?.user?.email || null;
}

// GET: list all appointments for this user
export async function GET(request) {
  try {
    const userId = await getUserId(request);
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
    console.error("GET /api/citas error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: update appointment status
export async function PATCH(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await request.json();
    const valid = ["pendiente", "confirmada", "cancelada"];
    if (!id || !valid.includes(status)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const { error } = await db()
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/citas error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: delete an appointment
export async function DELETE(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await db()
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/citas error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
