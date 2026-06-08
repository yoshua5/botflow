import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAnalytics, setAnalytics } from "@/lib/storage";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const data = await getAnalytics();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    await setAnalytics({ totalMessages: 0, totalConversations: 0, dailyCounts: {}, recentMessages: [] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/analytics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
