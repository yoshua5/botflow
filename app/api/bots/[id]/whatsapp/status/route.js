import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBots } from "@/lib/storage";

export async function GET(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: botId } = params;
    const bots = await getBots(userId);
    const bot = bots.find(b => b.id === botId);

    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    // Check if WhatsApp is connected
    const connected = !!bot.phoneNumberId;

    return NextResponse.json({
      connected,
      phoneNumber: bot.phoneNumber || null,
      phoneNumberId: bot.phoneNumberId || null,
      connectedAt: bot.connectedAt || null,
    });
  } catch (err) {
    console.error("WhatsApp status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
