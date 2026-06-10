import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const db = supabase();
  const { data } = await db.from("admin_notes").select("*").eq("user_id", userId).order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  return NextResponse.json({ notes: data || [] });
}

export async function POST(req) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { userId, content, is_pinned } = await req.json();
  if (!userId || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = supabase();
  const { data } = await db.from("admin_notes").insert({ user_id: userId, content, is_pinned: is_pinned || false }).select().single();
  return NextResponse.json({ note: data });
}

export async function PATCH(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, content, is_pinned } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabase();
  const update = { updated_at: new Date().toISOString() };
  if (content  !== undefined) update.content   = content;
  if (is_pinned !== undefined) update.is_pinned = is_pinned;
  await db.from("admin_notes").update(update).eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabase();
  await db.from("admin_notes").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
