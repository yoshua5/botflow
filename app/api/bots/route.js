import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBots, setBots } from "@/lib/storage";

export async function GET() {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    // ✅ CRITICAL: Pass userId explicitly to getBots()
    const bots = await getBots(userId);
    return NextResponse.json({ bots });
  } catch (err) {
    console.error("GET /api/bots error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();

    // ✅ CRITICAL: Fetch user's bots with userId
    const bots = await getBots(userId);

    // ✅ CRITICAL: Verify the bot belongs to this user
    const botExists = bots.some(b => b.id === id);
    if (!botExists) {
      console.warn(`⚠️ Unauthorized PATCH: userId=${userId} tried to update bot id=${id}`);
      return NextResponse.json({ error: "Bot not found or unauthorized" }, { status: 403 });
    }

    const updated = bots.map(b => b.id === id ? { ...b, status } : b);
    await setBots(updated, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/bots error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    // ✅ CRITICAL: Fetch user's bots with userId
    const bots = await getBots(userId);

    // ✅ CRITICAL: Verify the bot belongs to this user
    const botToDelete = bots.find(b => b.id === id);
    if (!botToDelete) {
      console.warn(`⚠️ Unauthorized DELETE: userId=${userId} tried to delete bot id=${id}`);
      return NextResponse.json({ error: "Bot not found or unauthorized" }, { status: 403 });
    }

    const updated = bots.filter(b => b.id !== id);
    await setBots(updated, userId);
    console.log(`✅ Bot deleted: id=${id}, userId=${userId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/bots error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
