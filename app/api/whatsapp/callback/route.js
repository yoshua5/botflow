import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { setBots, getBots } from "@/lib/storage";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/dashboard?wa_error=" + error, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/dashboard?wa_error=missing_params", request.url));
    }

    // Verify state
    const stateData = global.whatsappStates?.[state];
    if (!stateData || stateData.expiresAt < Date.now()) {
      return NextResponse.redirect(new URL("/dashboard?wa_error=invalid_state", request.url));
    }

    const { botId, userId } = stateData;
    delete global.whatsappStates[state]; // Clear state

    // Exchange code for access token
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/whatsapp/callback`;

    const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error?.message || "Failed to get access token");
    }

    // Get user's WhatsApp Business accounts
    const businessRes = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses?access_token=${tokenData.access_token}`
    );
    const businessData = await businessRes.json();

    // Get phone numbers (simplified: take first available)
    let phoneNumberId = null;
    let phoneNumber = null;

    if (businessData.data && businessData.data.length > 0) {
      const businessId = businessData.data[0].id;

      // Get WhatsApp numbers
      const numbersRes = await fetch(
        `https://graph.facebook.com/v19.0/${businessId}/phone_numbers?access_token=${tokenData.access_token}`
      );
      const numbersData = await numbersRes.json();

      if (numbersData.data && numbersData.data.length > 0) {
        phoneNumberId = numbersData.data[0].id;
        phoneNumber = numbersData.data[0].display_phone_number || numbersData.data[0].phone_number;
      }
    }

    // Update bot with WhatsApp connection info
    const allBots = await getBots(userId);
    const botIndex = allBots.findIndex(b => b.id === botId);

    if (botIndex !== -1) {
      allBots[botIndex] = {
        ...allBots[botIndex],
        phoneNumberId,
        phoneNumber,
        whatsappAccessToken: tokenData.access_token, // Store for later use
        connectedAt: new Date().toISOString(),
      };

      await setBots(allBots, userId);
    }

    // Redirect to bot page with success
    return NextResponse.redirect(
      new URL(`/dashboard/bots/${botId}?wa_connected=true`, request.url)
    );
  } catch (err) {
    console.error("WhatsApp callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?wa_error=" + encodeURIComponent(err.message), request.url)
    );
  }
}
