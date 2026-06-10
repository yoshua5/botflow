import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - must be logged in" },
        { status: 401 }
      );
    }

    const db = supabase();

    // Sum all analytics rows for this user (across all bots)
    const { data: rows } = await db
      .from("analytics")
      .select("total_messages, total_conversations, daily_counts")
      .eq("user_id", userId);

    let totalMessages = 0;
    let totalConversations = 0;
    const dailyCounts = {};
    for (const row of rows || []) {
      totalMessages      += row.total_messages      || 0;
      totalConversations += row.total_conversations || 0;
      for (const [date, cnt] of Object.entries(row.daily_counts || {})) {
        dailyCounts[date] = (dailyCounts[date] || 0) + cnt;
      }
    }

    // Recent messages from message_events
    const { data: events } = await db
      .from("message_events")
      .select("from_phone, message, bot_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const recentMessages = (events || []).map(e => ({
      from:    e.from_phone,
      message: e.message,
      botName: e.bot_name,
      date:    e.created_at.slice(0, 10),
      time:    e.created_at,
    }));

    return NextResponse.json({ totalMessages, totalConversations, dailyCounts, recentMessages });
  } catch (err) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - must be logged in" },
        { status: 401 }
      );
    }

    const db = supabase();

    // Delete ALL analytics rows for this user (all bot_ids)
    await db.from("analytics").delete().eq("user_id", userId);
    // Delete ALL message events for this user
    await db.from("message_events").delete().eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/analytics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
