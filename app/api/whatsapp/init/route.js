import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { botId } = await request.json();
    if (!botId) return NextResponse.json({ error: "botId required" }, { status: 400 });

    // Get Facebook App credentials from environment
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/whatsapp/callback`;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: "Facebook config missing" }, { status: 500 });
    }

    // Generate OAuth URL
    const state = Math.random().toString(36).substring(7);
    const scope = "business_management,whatsapp_business_messaging,instagram_basic,pages_manage_whatsapp";

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;

    // Store state in session/cache (simplified: store in memory, use Redis in prod)
    // For now, we'll validate state in the callback
    global.whatsappStates = global.whatsappStates || {};
    global.whatsappStates[state] = { botId, userId, expiresAt: Date.now() + 600000 };

    return NextResponse.json({ success: true, authUrl, state });
  } catch (err) {
    console.error("WhatsApp init error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
