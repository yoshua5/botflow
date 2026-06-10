import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search  = searchParams.get("search") || "";
  const filter  = searchParams.get("filter") || "all";
  const page    = parseInt(searchParams.get("page") || "1");
  const limit   = parseInt(searchParams.get("limit") || "50");
  const offset  = (page - 1) * limit;

  const db = supabase();
  try {
    let query = db.from("users").select("id, email, name, company, created_at, last_login");
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data: users, error: uErr } = await query;
    if (uErr) throw uErr;

    const userIds = (users || []).map(u => u.id);
    const [{ data: subs }, { data: bots }] = await Promise.all([
      db.from("subscriptions").select("user_id, plan, status, current_period_end").in("user_id", userIds),
      db.from("bots").select("id, user_id, status").in("user_id", userIds),
    ]);

    const subMap  = {};  (subs  || []).forEach(s => subMap[s.user_id]  = s);
    const botMap  = {};  (bots  || []).forEach(b => { botMap[b.user_id] = (botMap[b.user_id] || 0) + 1; });

    let enriched = (users || []).map(u => ({
      ...u,
      plan:       subMap[u.id]?.plan   || "free",
      subStatus:  subMap[u.id]?.status || "inactive",
      periodEnd:  subMap[u.id]?.current_period_end || null,
      botCount:   botMap[u.id] || 0,
    }));

    // Filter
    if (filter === "paid")     enriched = enriched.filter(u => u.subStatus === "active" && u.plan !== "free");
    if (filter === "trial")    enriched = enriched.filter(u => u.subStatus === "trialing");
    if (filter === "free")     enriched = enriched.filter(u => u.plan === "free");
    if (filter === "expired")  enriched = enriched.filter(u => u.subStatus === "canceled" || u.subStatus === "past_due");
    if (filter === "no_bots")  enriched = enriched.filter(u => u.botCount === 0);

    return NextResponse.json({ users: enriched, total: enriched.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId, action, data } = body;
  if (!userId || !action) return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });

  const db = supabase();
  try {
    if (action === "suspend") {
      await db.from("users").update({ status: "suspended" }).eq("id", userId);
      await logAdminAction(session.user.email, "suspend_user", userId);
    } else if (action === "reactivate") {
      await db.from("users").update({ status: "active" }).eq("id", userId);
      await logAdminAction(session.user.email, "reactivate_user", userId);
    } else if (action === "delete") {
      await db.from("users").delete().eq("id", userId);
      await logAdminAction(session.user.email, "delete_user", userId);
    } else if (action === "change_plan") {
      await db.from("subscriptions").upsert({ user_id: userId, plan: data.plan, status: "active", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      await logAdminAction(session.user.email, "change_plan", userId, data);
    } else if (action === "update") {
      await db.from("users").update({ name: data.name, company: data.company }).eq("id", userId);
      await logAdminAction(session.user.email, "update_user", userId, data);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
