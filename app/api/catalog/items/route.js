
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function uid() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return null;
  return s.user.id;
}

export async function GET(req) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id");
  const type       = searchParams.get("type");
  const status     = searchParams.get("status");
  const q          = searchParams.get("q");

  const db = supabase();
  const botId = searchParams.get("bot_id");
  let query = db.from("catalog_items")
    .select("*, catalog_categories(name, icon)")
    .eq("user_id", userId);
  if (botId) query = query.eq("bot_id", botId); else query = query.is("bot_id", null);
  query = query.order("created_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (type)       query = query.eq("type", type);
  if (status)     query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let items = data || [];
  if (q) {
    const lq = q.toLowerCase();
    items = items.filter(i =>
      i.name?.toLowerCase().includes(lq) ||
      i.description?.toLowerCase().includes(lq) ||
      (i.tags || []).some(t => t.toLowerCase().includes(lq))
    );
  }
  return NextResponse.json({ items });
}

export async function POST(req) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, description, price, currency, type, category_id, images, sku, inventory, status, tags } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const db = supabase();
  const { data, error } = await db.from("catalog_items").insert({
    user_id: userId,
    bot_id: body.bot_id || null,
    name, description,
    price: price ? parseFloat(price) : null,
    currency: currency || "MXN",
    type: type || "service",
    category_id: category_id || null,
    images: images || [],
    sku: sku || null,
    inventory: inventory ?? null,
    status: status || "active",
    tags: tags || [],
    updated_at: new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
