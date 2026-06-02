import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const IS_VERCEL = !!process.env.KV_REST_API_URL;

async function kv() {
  const mod = await import("@vercel/kv");
  return mod.kv;
}

// GET — check if onboarding is done
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ done: false });

  if (IS_VERCEL) {
    const store = await kv();

    // Check explicit onboarding-done flag
    const done = await store.get(`onboarding-done:${userId}`);
    if (done) return NextResponse.json({ done: true });

    // Auto-complete onboarding for existing users who already have config
    const existingConfig = await store.get(`botflow-config:${userId}`);
    if (existingConfig) {
      // Mark as done so we don't check again
      await store.set(`onboarding-done:${userId}`, true);
      return NextResponse.json({ done: true });
    }

    return NextResponse.json({ done: false });
  }
  // In local dev, always skip onboarding
  return NextResponse.json({ done: true });
}

// POST — save onboarding data and mark as done
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { businessName, businessType, services, tone, botName, welcomeMessage, phoneNumberId, plan } = body;

  if (IS_VERCEL) {
    const store = await kv();

    // Save bot config
    const config = {
      businessName: businessName || "",
      businessType: businessType || "",
      services: services || "",
      tone: tone || "amigable",
      botName: botName || businessName || "Agente",
      welcomeMessage: welcomeMessage || `¡Hola! Soy el asistente virtual de ${businessName}. ¿En qué te puedo ayudar?`,
      phoneNumberId: phoneNumberId || "",
      plan: plan || "free",
      createdAt: new Date().toISOString(),
    };

    // Save to botflow-config (merging with existing)
    const existing = await store.get(`botflow-config:${userId}`) || {};
    await store.set(`botflow-config:${userId}`, { ...existing, ...config });

    // Phone mapping if provided
    if (phoneNumberId) {
      await store.set(`wa-phone:${phoneNumberId}`, userId);
    }

    // Mark onboarding as done
    await store.set(`onboarding-done:${userId}`, true);
  }

  return NextResponse.json({ success: true });
}
