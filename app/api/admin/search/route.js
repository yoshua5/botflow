import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const db = supabase();
  const [{ data: users }, { data: bots }] = await Promise.all([
    db.from("users").select("id, email, name").or(`email.ilike.%${q}%,name.ilike.%${q}%`).limit(5),
    db.from("bots").select("id, user_id, name, handle").or(`name.ilike.%${q}%,handle.ilike.%${q}%`).limit(5),
  ]);

  const results = [
    ...(users || []).map(u => ({ type: "user", id: u.id, label: u.email, sublabel: u.name, href: `/dashboard/super-admin/users/${u.id}` })),
    ...(bots  || []).map(b => ({ type: "bot",  id: b.id, label: b.name, sublabel: b.handle, href: `/dashboard/super-admin/bots` })),
  ];
  return NextResponse.json({ results });
}
