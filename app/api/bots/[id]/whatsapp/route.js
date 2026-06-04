import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBots, setBots } from "@/lib/storage";

export async function GET(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: botId } = params;
    const bots = await getBots(userId);
    const bot = bots.find(b => b.id === botId);

    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    return NextResponse.json({
      phoneNumberId: bot.phoneNumberId || null,
      phoneNumber: bot.phoneNumber || null,
      connected: !!bot.phoneNumberId,
    });
  } catch (err) {
    console.error("Get WhatsApp error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: botId } = params;
    const bots = await getBots(userId);
    const botIndex = bots.findIndex(b => b.id === botId);

    if (botIndex === -1) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    // Remove WhatsApp connection
    bots[botIndex] = {
      ...bots[botIndex],
      phoneNumberId: null,
      phoneNumber: null,
      whatsappAccessToken: null,
    };

    await setBots(bots, userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete WhatsApp error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
