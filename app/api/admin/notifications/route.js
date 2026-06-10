import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ notifications: [], unread: 0 }, { status: 401 });

  const db = supabase();
  const { data } = await db.from("notifications").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20);
  const unread = (data || []).filter(n => !n.is_read).length;
  return NextResponse.json({ notifications: data || [], unread });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAllRead } = await req.json();
  const db = supabase();

  if (markAllRead) {
    await db.from("notifications").update({ is_read: true }).eq("user_id", session.user.id);
  } else if (id) {
    await db.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", session.user.id);
  }
  return NextResponse.json({ ok: true });
}
