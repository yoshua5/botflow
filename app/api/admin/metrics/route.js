import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = supabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    const [
      { data: users },
      { data: subs },
      { data: bots },
      { data: msgs },
      { data: convs },
      { data: newToday },
      { data: newWeek },
      { data: newMonth },
    ] = await Promise.all([
      db.from("users").select("id, email, name, created_at"),
      db.from("subscriptions").select("user_id, plan, status"),
      db.from("bots").select("id, user_id, status"),
      db.from("message_events").select("id", { count: "exact", head: true }),
      db.from("conversations").select("id", { count: "exact", head: true }),
      db.from("users").select("id").gte("created_at", todayStart),
      db.from("users").select("id").gte("created_at", weekStart),
      db.from("users").select("id").gte("created_at", monthStart),
    ]);

    const subMap = {};
    (subs || []).forEach(s => { subMap[s.user_id] = s; });

    const totalUsers    = (users || []).length;
    const paidUsers     = (subs  || []).filter(s => s.status === "active" && s.plan !== "free").length;
    const trialUsers    = (subs  || []).filter(s => s.status === "trialing").length;
    const expiredUsers  = (subs  || []).filter(s => s.status === "canceled" || s.status === "past_due").length;
    const activeUsers   = totalUsers - expiredUsers;
    const totalBots     = (bots  || []).length;
    const activeBots    = (bots  || []).filter(b => b.status === "active").length;

    // Growth data: users per day last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentUsers } = await db.from("users").select("created_at").gte("created_at", thirtyDaysAgo);
    const growthByDay = {};
    (recentUsers || []).forEach(u => {
      const day = u.created_at.substring(0, 10);
      growthByDay[day] = (growthByDay[day] || 0) + 1;
    });
    const growth = Object.entries(growthByDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

    // Plan distribution
    const planDist = { free: 0, starter: 0, pro: 0, enterprise: 0 };
    (users || []).forEach(u => {
      const plan = subMap[u.id]?.plan || "free";
      planDist[plan] = (planDist[plan] || 0) + 1;
    });

    // Recent activity
    const { data: recentBots } = await db.from("bots").select("id, name, user_id, created_at").order("created_at", { ascending: false }).limit(5);
    const { data: recentSubs } = await db.from("subscriptions").select("user_id, plan, status, updated_at").order("updated_at", { ascending: false }).limit(5);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      trialUsers,
      paidUsers,
      expiredUsers,
      freeUsers: totalUsers - paidUsers - trialUsers,
      totalBots,
      activeBots,
      messagesProcessed: msgs?.length || 0,
      conversationsProcessed: convs?.length || 0,
      newUsersToday: (newToday || []).length,
      newUsersWeek:  (newWeek  || []).length,
      newUsersMonth: (newMonth || []).length,
      growth,
      planDistribution: planDist,
      recentBots: recentBots || [],
      recentSubscriptions: recentSubs || [],
    });
  } catch (err) {
    console.error("Admin metrics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
