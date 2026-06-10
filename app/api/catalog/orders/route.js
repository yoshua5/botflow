
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const s = await getServerSession(authOptions);
  const userId = s?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const db = supabase();
  let q = db.from("catalog_orders")
    .select("*, catalog_items(name, type, images)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Revenue summary
  const paid = (data || []).filter(o => o.status === "paid");
  const totalRevenue = paid.reduce((s, o) => s + (o.seller_payout || 0), 0);
  const totalOrders  = paid.length;

  return NextResponse.json({ orders: data || [], totalRevenue, totalOrders });
}
