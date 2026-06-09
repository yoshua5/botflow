import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConfig } from "@/lib/storage";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = await getConfig(session.user.id);
  const phoneNumberId = cfg.phoneNumberId;
  const token = cfg.accessToken;

  if (!phoneNumberId || !token) {
    return Response.json({ error: "WhatsApp no configurado." }, { status: 400 });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Body invalido" }, { status: 400 }); }
  const { imageBase64, mimeType } = body;
  if (!imageBase64 || !mimeType) return Response.json({ error: "Imagen requerida" }, { status: 400 });

  const imageBuffer = Buffer.from(imageBase64, "base64");

  // Step 1: Create resumable upload session
  const sessionRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/uploads?file_length=${imageBuffer.length}&file_type=${mimeType}&file_name=profile.jpg`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok) {
    console.error("Upload session error:", JSON.stringify(sessionData));
    // Fallback: try the messaging media endpoint
    return uploadViaMessagingMedia(phoneNumberId, token, imageBuffer, mimeType);
  }

  // Step 2: Upload file bytes to the resumable session
  const uploadRes = await fetch(
    `https://rupload.facebook.com/whatsapp-business-media/${sessionData.id}`,
    {
      method: "POST",
      headers: {
        Authorization: `OAuth ${token}`,
        "file_offset": "0",
        "Content-Type": mimeType,
      },
      body: imageBuffer,
    }
  );
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    console.error("File upload error:", JSON.stringify(uploadData));
    return Response.json({ error: `[subir] ${uploadData.error?.message || "Error al subir imagen"}` }, { status: 400 });
  }

  // Step 3: Set profile picture using the handle
  const handle = uploadData.h;
  const profileRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", profile_picture_handle: handle }),
    }
  );
  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    console.error("Profile update error:", JSON.stringify(profileData));
    return Response.json({ error: `[perfil] ${profileData.error?.message || "Error al actualizar perfil"}` }, { status: 400 });
  }

  return Response.json({ success: true });
}

async function uploadViaMessagingMedia(phoneNumberId, token, imageBuffer, mimeType) {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  formData.append("file", blob, "profile.jpg");
  formData.append("messaging_product", "whatsapp");
  formData.append("type", "image");

  const uploadRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
  );
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    return Response.json({ error: `[media] ${uploadData.error?.message || "Error al subir imagen"}` }, { status: 400 });
  }

  const profileRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", profile_picture_handle: uploadData.id }),
    }
  );
  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    return Response.json({ error: `[perfil2] ${profileData.error?.message || "Error al actualizar perfil"}` }, { status: 400 });
  }

  return Response.json({ success: true });
}
