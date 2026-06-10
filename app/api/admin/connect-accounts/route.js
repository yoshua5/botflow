
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const db = supabase();
  const { data } = await db.from("stripe_connect_accounts")
    .select("*").order("created_at", { ascending: false });
  return NextResponse.json({ accounts: data || [] });
}
