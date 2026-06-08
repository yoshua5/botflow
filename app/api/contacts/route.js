import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const db = supabase();

  // Get all unique conversations (contacts) for this user
  const { data, error } = await db
    .from("conversations")
    .select("from_phone, contact_name, bot_id, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get bot names
  const { data: bots } = await db
    .from("bots")
    .select("id, name, agent_name")
    .eq("user_id", userId);

  const botMap = {};
  (bots || []).forEach(b => { botMap[b.id] = b.agent_name || b.name || "Bot"; });

  // Deduplicate by from_phone (keep most recent per phone)
  const seen = new Set();
  const contacts = [];
  for (const row of (data || [])) {
    if (seen.has(row.from_phone)) continue;
    seen.add(row.from_phone);

    // Calculate if active (messaged in last 24h)
    const lastActivity = new Date(row.updated_at);
    const hoursAgo = (Date.now() - lastActivity.getTime()) / 3600000;

    contacts.push({
      phone:        row.from_phone,
      name:         row.contact_name || row.from_phone,
      botId:        row.bot_id,
      botName:      botMap[row.bot_id] || "Bot",
      lastActivity: row.updated_at,
      active:       hoursAgo < 24,
    });
  }

  return NextResponse.json({ contacts });
}
