import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = supabase();
  const { data, error: dbError } = await db.from("announcements").select("*").order("created_at", { ascending: false }).limit(100);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ announcements: data || [] });
}

export async function POST(req) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { action } = body;
  const db = supabase();

  if (action === "create") {
    const { title, message, cta_text, cta_url, priority, channels, target_segment, scheduled_at } = body;
    const { data, error: dbError } = await db.from("announcements").insert({
      title, message, cta_text, cta_url, priority: priority || "info",
      channels: channels || ["in_app"],
      target_segment: target_segment || "all",
      scheduled_at: scheduled_at || null,
      status: scheduled_at ? "scheduled" : "draft",
    }).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    await logAdminAction(session.user.email, "create_announcement", null, { id: data?.id });
    return NextResponse.json({ announcement: data });
  }

  if (action === "send") {
    const { announcementId } = body;
    const { data: ann } = await db.from("announcements").select("*").eq("id", announcementId).single();
    if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let userQuery = db.from("users").select("id");
    const { data: allUsers } = await userQuery;
    const { data: subs } = await db.from("subscriptions").select("user_id, plan, status");
    const subMap = {};  (subs || []).forEach(s => subMap[s.user_id] = s);

    let targetUsers = allUsers || [];
    if (ann.target_segment === "paid")    targetUsers = targetUsers.filter(u => subMap[u.id]?.status === "active" && subMap[u.id]?.plan !== "free");
    if (ann.target_segment === "trial")   targetUsers = targetUsers.filter(u => subMap[u.id]?.status === "trialing");
    if (ann.target_segment === "free")    targetUsers = targetUsers.filter(u => !subMap[u.id] || subMap[u.id]?.plan === "free");
    if (ann.target_segment === "expired") targetUsers = targetUsers.filter(u => subMap[u.id]?.status === "canceled");

    if ((ann.channels || []).includes("in_app")) {
      const notifications = targetUsers.map(u => ({
        user_id: u.id,
        announcement_id: ann.id,
        title: ann.title,
        message: ann.message,
        type: ann.priority || "info",
        is_read: false,
      }));
      if (notifications.length > 0) {
        await db.from("notifications").insert(notifications);
      }
    }

    await db.from("announcements").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      delivery_stats: { sent: targetUsers.length, channels: ann.channels },
    }).eq("id", announcementId);

    await logAdminAction(session.user.email, "send_announcement", null, { id: announcementId, recipients: targetUsers.length });
    return NextResponse.json({ ok: true, sent: targetUsers.length });
  }

  if (action === "delete") {
    await db.from("announcements").delete().eq("id", body.announcementId);
    return NextResponse.json({ ok: true
