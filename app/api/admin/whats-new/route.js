import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const db = supabase();
  // Get active whats_new items not yet seen by this user
  const { data: all } = await db.from("whats_new").select("*").eq("is_active", true).order("created_at", { ascending: false });
  const { data: seen } = await db.from("whats_new_seen").select("whats_new_id").eq("user_id", session.user.id);
  const seenIds = new Set((seen || []).map(s => s.whats_new_id));
  const unseen = (all || []).filter(w => !seenIds.has(w.id));
  return NextResponse.json({ items: unseen });
}

export async function POST(req) {
  const { action, id } = await req.json();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabase();
  if (action === "mark_seen" && id) {
    await db.from("whats_new_seen").upsert({ user_id: session.user.id, whats_new_id: id }, { onConflict: "user_id,whats_new_id" });
    return NextResponse.json({ ok: true });
  }

  // Admin: create new whats_new item
  const { error } = await requireAdmin();
  if (error) return error;

  const { title, description, image_url, video_url, learn_more_url } = req.body || await req.json().catch(() => ({}));
  const { data } = await db.from("whats_new").insert({ title, description, image_url, video_url, learn_more_url }).select().single();
  return NextResponse.json({ item: data });
}
