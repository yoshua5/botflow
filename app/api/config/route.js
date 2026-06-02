import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConfig, setConfig } from "@/lib/storage";

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

    const config = await getConfig();
    // Mask sensitive tokens
    const safe = {
      ...config,
      accessToken:  config.accessToken  ? "****" + config.accessToken.slice(-6)  : "",
      anthropicKey: config.anthropicKey ? "****" + config.anthropicKey.slice(-6) : "",
      configured: !!(config.phoneNumberId && config.accessToken && config.anthropicKey),
    };
    return NextResponse.json(safe);
  } catch (err) {
    console.error("GET /api/config error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const body    = await request.json();
    const current = await getConfig();

    const updated = { ...current, ...body };

    // Never overwrite credentials with empty or masked values
    if (!body.accessToken || body.accessToken.startsWith("****")) {
      updated.accessToken = current.accessToken || "";
    }
    if (!body.anthropicKey || body.anthropicKey.startsWith("****")) {
      updated.anthropicKey = current.anthropicKey || "";
    }
    if (!body.phoneNumberId) {
      updated.phoneNumberId = current.phoneNumberId || "";
    }
    if (!body.verifyToken) {
      updated.verifyToken = current.verifyToken || "botflow123";
    }

    await setConfig(updated);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/config error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
