import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getBots, setBots, getConfig, setConfig, setPhoneMapping } from "@/lib/storage";

export async function GET(request, { params }) {
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

    const { id } = params;
    // ✅ CRITICAL: Fetch user's bots with userId
    const bots = await getBots(userId);
    const bot = bots.find(b => b.id === id);

    // ✅ CRITICAL: Verify the bot belongs to this user
    if (!bot) {
      console.warn(`⚠️ Unauthorized GET: userId=${userId} tried to access bot id=${id}`);
      return NextResponse.json({ error: "Bot not found or unauthorized" }, { status: 403 });
    }

    // Merge config fields into bot so the UI shows current values
    const config = await getConfig(userId);
    const merged = {
      ...config,
      ...bot,
      accessToken:  bot.accessToken  ? bot.accessToken  : (config.accessToken  ? "••••••" : ""),
      anthropicKey: config.anthropicKey ? "••••••" : "",
    };

    // If displayPhone is missing but we have credentials, fetch it from Meta API
    const token = bot.accessToken || config.accessToken;
    const phoneId = bot.phoneNumberId || config.phoneNumberId;
    if (!merged.displayPhone && token && phoneId && !token.startsWith("••")) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${phoneId}?fields=display_phone_number,verified_name&access_token=${token}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (res.ok) {
          const d = await res.json();
          if (d.display_phone_number) {
            merged.displayPhone = d.display_phone_number;
            // Persist it so we don't have to fetch every time
            const idx = bots.findIndex(b => b.id === id);
            if (idx !== -1) {
              bots[idx].displayPhone = d.display_phone_number;
              if (d.verified_name) bots[idx].waVerifiedName = d.verified_name;
              await setBots(bots, userId);
            }
          }
        }
      } catch { /* silent fail */ }
    }

    return NextResponse.json({ bot: merged });
  } catch (err) {
    console.error("GET /api/bots/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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

    const { id } = params;
    const updates = await request.json();

    // ✅ CRITICAL: Fetch user's bots with userId
    const bots = await getBots(userId);
    const idx = bots.findIndex(b => b.id === id);

    // ✅ CRITICAL: Verify the bot belongs to this user
    if (idx === -1) {
      console.warn(`⚠️ Unauthorized PUT: userId=${userId} tried to update bot id=${id}`);
      return NextResponse.json({ error: "Bot not found or unauthorized" }, { status: 403 });
    }

    const oldBot = bots[idx];
    bots[idx] = { ...oldBot, ...updates, id };

    // Auto-fix greeting when agentName changes and greeting still mentions old name
    const newAgentName = bots[idx].agentName;
    const oldAgentName = oldBot.agentName;
    if (newAgentName && oldAgentName && newAgentName !== oldAgentName) {
      const greeting = bots[idx].greeting || "";
      // If greeting mentions the old agent name (or is auto-generated), regenerate it
      if (!greeting || greeting.includes(oldAgentName)) {
        bots[idx].greeting = `¡Hola! Soy ${newAgentName}, ¿en qué te puedo ayudar hoy? 😊`;
      }
    }

    // ✅ CRITICAL: Save with userId to ensure RLS enforcement
    await setBots(bots, userId);

    // Also sync relevant fields to main config (used by the webhook)
    const current = await getConfig(userId);
    const bot = bots[idx];
    const configPatch = {};
    const syncFields = [
      "businessName","businessDesc","agentName","tone","hours","location","services",
      "language","useEmojis","shortAnswers","greeting","extraInstructions","faqs","displayPhone",
      "website","contactPhone","instagram","facebook","tiktok","companyDescription",
      "appointments","businessProfile","fullAddress","phone","pricePolicy","catalog","flow",
    ];
    syncFields.forEach(f => { if (bot[f] !== undefined) configPatch[f] = bot[f]; });

    // Sync credentials only if they were explicitly set (not empty)
    if (bot.accessToken)  configPatch.accessToken  = bot.accessToken;
    if (bot.phoneNumberId) configPatch.phoneNumberId = bot.phoneNumberId;
    if (bot.verifyToken)  configPatch.verifyToken  = bot.verifyToken;
    if (bot.waBusinessId) configPatch.waBusinessId = bot.waBusinessId;

    await setConfig({ ...current, ...configPatch }, userId);

    // If phoneNumberId was set/changed, update the phone→bot mapping
    if (bot.phoneNumberId) {
      await setPhoneMapping(bot.phoneNumberId, userId, id);
    }

    return NextResponse.json({ bot: bots[idx] });
  } catch (err) {
    console.error("PUT /api/bots/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
