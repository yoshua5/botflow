import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabase();
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ notifications: [], unread: 0 });

  const notifications = data || [];
  const unread = notifications.filter(n => !n.is_read).length;
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = supabase();

  if (body.markAllRead) {
    await db.from("notifications").update({ is_read: true }).eq("user_id", session.user.id);
    return NextResponse.json({ ok: true });
  }

  if (body.notificationId) {
    await db.from("notifications").update({ is_read: true }).eq("id", body.notificationId).eq("user_id", session.user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
