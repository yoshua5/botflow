
import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const db = supabase();
  const { data } = await db.from("platform_commission").select("*").limit(1).single();
  return NextResponse.json({ commission: data || { mode:"none", enabled:false, fixed_amount:0, percentage:0 } });
}

export async function POST(req) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { mode, fixed_amount, percentage, enabled, currency } = body;
  const db = supabase();

  // Upsert (there should only be one row)
  const { data: existing } = await db.from("platform_commission").select("id").limit(1).single();
  let result;
  if (existing?.id) {
    const { data } = await db.from("platform_commission").update({
      mode: mode || "none",
      fixed_amount: parseFloat(fixed_amount) || 0,
      percentage:   parseFloat(percentage) || 0,
      enabled:      !!enabled,
      currency:     currency || "MXN",
      updated_by:   session.user.email,
      updated_at:   new Date().toISOString(),
    }).eq("id", existing.id).select().single();
    result = data;
  } else {
    const { data } = await db.from("platform_commission").insert({
      mode: mode || "none",
      fixed_amount: parseFloat(fixed_amount) || 0,
      percentage:   parseFloat(percentage) || 0,
      enabled:      !!enabled,
      currency:     currency || "MXN",
      updated_by:   session.user.email,
    }).select().single();
    result = data;
  }

  await logAdminAction(session.user.email, "update_commission", null, { mode, enabled });
  return NextResponse.json({ commission: result });
}
