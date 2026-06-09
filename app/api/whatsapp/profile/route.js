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

  // Step 1: Create upload session
  const sessionRes = await fetch(
    `https://graph.facebook.com/v19.0/app/uploads?file_length=${imageBuffer.length}&file_type=${encodeURIComponent(mimeType)}&file_name=profile.jpg`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok) {
    return Response.json({ error: `[session ${sessionData.error?.code}] ${sessionData.error?.message || JSON.stringify(sessionData)}` }, { status: 400 });
  }

  // Step 2: Upload file bytes to graph.facebook.com/{upload-session-id}
  const uploadRes = await fetch(
    `https://graph.facebook.com/v19.0/${sessionData.id}`,
    {
      method: "POST",
      headers: {
        Authorization: `OAuth ${token}`,
        "file_offset": "0",
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    }
  );
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.h) {
    const errMsg = uploadData.error?.message || JSON.stringify(uploadData);
    return Response.json({ error: `[upload] ${errMsg}` }, { status: 400 });
  }

  // Step 3: Set profile picture with handle
  const profileRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", profile_picture_handle: uploadData.h }),
    }
  );
  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    return Response.json({ error: `[perfil ${profileData.error?.code}] ${profileData.error?.message || JSON.stringify(profileData)}` }, { status: 400 });
  }

  return Response.json({ success: true });
}
