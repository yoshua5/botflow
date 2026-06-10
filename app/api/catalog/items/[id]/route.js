
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function uid() {
  const s = await getServerSession(authOptions);
  return s?.user?.id || null;
}

export async function GET(req, { params }) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = supabase();
  const { data, error } = await db.from("catalog_items")
    .select("*, catalog_categories(name, icon)")
    .eq("id", params.id).eq("user_id", userId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req, { params }) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const db = supabase();
  const allowed = ["name","description","price","currency","type","category_id","images","sku","inventory","status","tags","meta","stripe_price_id","stripe_product_id"];
  const updates = {};
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = k === "price" ? parseFloat(body[k]) : body[k];
  }
  updates.updated_at = new Date().toISOString();
  const { data, error } = await db.from("catalog_items")
    .update(updates).eq("id", params.id).eq("user_id", userId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req, { params }) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = supabase();
  const { error } = await db.from("catalog_items").delete().eq("id", params.id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
