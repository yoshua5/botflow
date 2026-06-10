import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const db = supabase();

  try {
    let query = db.from("bots").select("id, user_id, name, handle, status, phone_number_id, created_at");
    if (search) query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`);
    query = query.order("created_at", { ascending: false }).limit(200);
    const { data: bots } = await query;

    const userIds = [...new Set((bots || []).map(b => b.user_id))];
    const { data: users } = await db.from("users").select("id, email, name").in("id", userIds);
    const userMap = {};  (users || []).forEach(u => userMap[u.id] = u);

    const enriched = (bots || []).map(b => ({
      ...b,
      userEmail: userMap[b.user_id]?.email || "unknown",
      userName:  userMap[b.user_id]?.name  || "unknown",
    }));
    return NextResponse.json({ bots: enriched });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { botId, action } = await req.json();
  if (!botId || !action) return NextResponse.json({ error: "Missing botId or action" }, { status: 400 });

  const db = supabase();
  try {
    if (action === "disable") {
      await db.from("bots").update({ status: "inactive" }).eq("id", botId);
    } else if (action === "enable") {
      await db.from("bots").update({ status: "active" }).eq("id", botId);
    } else if (action === "delete") {
      await db.from("bots").delete().eq("id", botId);
    }
    await logAdminAction(session.user.email, `${action}_bot`, null, { botId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
