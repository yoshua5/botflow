
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/catalog?userId=xxx&q=xxx   used by WhatsApp AI (server-to-server)
// GET /api/catalog                    authenticated user gets own catalog
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const qUserId = searchParams.get("userId");
  const q       = searchParams.get("q");
  const type    = searchParams.get("type");

  let userId = qUserId;
  if (!userId) {
    const s = await getServerSession(authOptions);
    userId = s?.user?.id;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabase();
  let query = db.from("catalog_items")
    .select("id, name, description, price, currency, type, images, tags, status, catalog_categories(name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("name");

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let items = data || [];
  if (q) {
    const lq = q.toLowerCase();
    items = items.filter(i =>
      i.name?.toLowerCase().includes(lq) ||
      i.description?.toLowerCase().includes(lq) ||
      (i.tags || []).some(t => String(t).toLowerCase().includes(lq))
    );
  }
  return NextResponse.json({ items });
}
