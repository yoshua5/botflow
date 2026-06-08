import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getBots, setBots, setPhoneMapping, getConfig, setConfig } from "@/lib/storage";

export async function POST(req) {
  const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, botId } = await req.json();
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const appId = process.env.META_APP_ID || "1806315730812154";
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    return NextResponse.json({ error: "META_APP_SECRET not configured" }, { status: 500 });
  }

  try {
    // Step 1: Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.json({ error: "Failed to get access token", details: tokenData }, { status: 400 });
    }

    const userToken = tokenData.access_token;

    // Step 2: Get WhatsApp Business Accounts
    const wabaRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?fields=whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number}}&access_token=${userToken}`
    );
    const wabaData = await wabaRes.json();

    // Step 3: Extract first phone number
    let phoneNumberId = null;
    let wabaId = null;
    let displayPhone = null;

    const businesses = wabaData.data || [];
    for (const biz of businesses) {
      const wabas = biz.whatsapp_business_accounts?.data || [];
      for (const waba of wabas) {
        wabaId = waba.id;
        const phones = waba.phone_numbers?.data || [];
        if (phones.length > 0) {
          phoneNumberId = phones[0].id;
          displayPhone = phones[0].display_phone_number;
          break;
        }
      }
      if (phoneNumberId) break;
    }

    // Alternative: try direct shared_waba endpoint
    if (!phoneNumberId) {
      const sharedRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${userToken}&access_token=${appId}|${appSecret}`
      );
      const sharedData = await sharedRes.json();
      const granular = sharedData?.data?.granular_scopes || [];
      const wabaScope = granular.find(s => s.scope === "whatsapp_business_management");
      if (wabaScope?.target_ids?.length) {
        wabaId = wabaScope.target_ids[0];
        const phoneRes = await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?fields=id,display_phone_number&access_token=${userToken}`
        );
        const phoneData = await phoneRes.json();
        if (phoneData.data?.length > 0) {
          phoneNumberId = phoneData.data[0].id;
          displayPhone = phoneData.data[0].display_phone_number;
        }
      }
    }

    if (!phoneNumberId || !wabaId) {
      return NextResponse.json({ error: "No WhatsApp phone numbers found in this account" }, { status: 400 });
    }

    // Step 4: Save to bot + config + phone mapping
    if (botId) {
      // Save phoneNumberId to this specific bot
      const bots = await getBots(userId);
      const updated = bots.map(b => b.id === botId
        ? { ...b, phoneNumberId, waBusinessId: wabaId, accessToken: userToken, displayPhone }
        : b
      );
      await setBots(updated, userId);

      // Map phoneNumberId → {userId, botId} so webhook knows which bot to use
      await setPhoneMapping(phoneNumberId, userId, botId);

      // Save credentials to global config (webhook needs accessToken + anthropicKey)
      const current = await getConfig();
      await setConfig({
        ...current,
        accessToken:   userToken,
        phoneNumberId,
        waBusinessId:  wabaId,
      });
    }

    return NextResponse.json({
      success: true,
      phoneNumberId,
      wabaId,
      accessToken: userToken,
      displayPhone,
    });

  } catch (err) {
    console.error("WhatsApp signup error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
