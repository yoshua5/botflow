import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getConfig } from "@/lib/storage";

const GRAPH_VERSION = "v19.0";

async function getWACredentials() {
  const config = await getConfig();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || config.accessToken;
  const phoneNumberId = process.env.PHONE_NUMBER_ID || config.phoneNumberId;
  if (!accessToken || !phoneNumberId) throw new Error("WhatsApp no configurado");
  return { accessToken, phoneNumberId };
}

// GET — fetch current WhatsApp Business profile
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

    const { accessToken, phoneNumberId } = await getWACredentials();
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/whatsapp_business_profile?fields=about,addr,description,email,profile_picture_url,websites,vertical`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message || "Error de Meta" }, { status: 400 });
    const profile = data.data?.[0] || data;
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Helper: upload image using Meta's Resumable Upload API
// This returns the "h:..." handle required for profile picture updates
async function uploadProfileImage(accessToken, imageBuffer, imageMimeType) {
  // ── Step A: Get the App ID from the access token ──────────────────────
  const appRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/app`,
    { headers: { Authorization: `OAuth ${accessToken}` } }
  );
  const appData = await appRes.json();
  if (!appRes.ok || !appData.id) {
    throw new Error("No se pudo obtener el App ID de Meta: " + (appData?.error?.message || JSON.stringify(appData)));
  }
  const appId = appData.id;
  console.log("WA App ID:", appId);

  // ── Step B: Create upload session ────────────────────────────────────
  const sessionRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${appId}/uploads?` +
    `file_name=profile.jpg&file_length=${imageBuffer.length}&file_type=${encodeURIComponent(imageMimeType)}`,
    {
      method: "POST",
      headers: { Authorization: `OAuth ${accessToken}` },
    }
  );
  const sessionText = await sessionRes.text();
  let sessionData;
  try { sessionData = JSON.parse(sessionText); } catch { sessionData = { raw: sessionText }; }

  console.log("Upload session response:", JSON.stringify(sessionData));

  if (!sessionRes.ok || !sessionData.id) {
    throw new Error("Error creando sesión de upload: " + (sessionData?.error?.message || sessionData?.raw || JSON.stringify(sessionData)));
  }
  const uploadSessionId = sessionData.id; // "upload://{app-id}/..."

  // ── Step C: Upload the binary image data ─────────────────────────────
  const uploadRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${uploadSessionId}`,
    {
      method: "POST",
      headers: {
        Authorization: `OAuth ${accessToken}`,
        file_offset: "0",
        "Content-Type": imageMimeType,
      },
      body: imageBuffer,
    }
  );
  const uploadText = await uploadRes.text();
  let uploadData;
  try { uploadData = JSON.parse(uploadText); } catch { uploadData = { raw: uploadText }; }

  console.log("File upload response:", JSON.stringify(uploadData));

  if (!uploadRes.ok) {
    throw new Error("Error subiendo imagen: " + (uploadData?.error?.message || uploadData?.raw || JSON.stringify(uploadData)));
  }

  // uploadData.h is the profile picture handle, e.g. "4:AbCdEf..."
  if (!uploadData.h) {
    throw new Error("Meta no devolvió handle de imagen (h). Respuesta: " + JSON.stringify(uploadData));
  }

  return uploadData.h;
}

// POST — update profile photo and/or about text
export async function POST(request) {
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

    const { accessToken, phoneNumberId } = await getWACredentials();
    const { about, imageBase64, imageMimeType } = await request.json();

    let profilePictureHandle = null;

    // ── Upload image if provided ──────────────────────────────────────
    if (imageBase64 && imageMimeType) {
      const imageBuffer = Buffer.from(imageBase64, "base64");
      try {
        profilePictureHandle = await uploadProfileImage(accessToken, imageBuffer, imageMimeType);
      } catch (uploadErr) {
        console.error("Profile image upload error:", uploadErr.message);
        return NextResponse.json({ error: uploadErr.message, step: "upload_image" }, { status: 400 });
      }
    }

    // ── Update WhatsApp Business profile ─────────────────────────────
    const updateBody = { messaging_product: "whatsapp" };
    if (about !== undefined && about !== null) updateBody.about = about;
    if (profilePictureHandle) updateBody.profile_picture_handle = profilePictureHandle;

    if (Object.keys(updateBody).length <= 1) {
      return NextResponse.json({ success: true, message: "Nada que actualizar" });
    }

    const updateRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/whatsapp_business_profile`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      }
    );

    const updateText = await updateRes.text();
    let updateData;
    try { updateData = JSON.parse(updateText); } catch { updateData = { raw: updateText }; }
    console.log("WA Profile update response:", JSON.stringify(updateData));

    if (!updateRes.ok) {
      const errMsg = updateData?.error?.error_user_msg || updateData?.error?.message || updateData?.raw || "Error actualizando perfil";
      return NextResponse.json({ error: errMsg, detail: updateData, step: "update_profile" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      handle: profilePictureHandle,
      note: "WhatsApp puede tardar unos minutos en mostrar la foto. Si no aparece, cierra y reabre WhatsApp.",
    });
  } catch (err) {
    console.error("WhatsApp profile update error:", err);
    return NextResponse.json({ error: err.message, step: "exception" }, { status: 500 });
  }
}
