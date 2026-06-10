import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";
import { PLANS } from "@/lib/plans";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = supabase();
  const { data: dbPlans } = await db.from("db_plans").select("*").order("price");
  
  // Merge DB plans with hardcoded plans (DB takes precedence)
  if (dbPlans && dbPlans.length > 0) {
    return NextResponse.json({ plans: dbPlans });
  }
  return NextResponse.json({ plans: PLANS });
}

export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const db = supabase();
  const { data } = await db.from("db_plans").insert(body).select().single();
  return NextResponse.json({ plan: data });
}

export async function PATCH(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabase();
  updates.updated_at = new Date().toISOString();
  await db.from("db_plans").update(updates).eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabase();
  await db.from("db_plans").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
