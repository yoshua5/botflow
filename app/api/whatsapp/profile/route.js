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
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  formData.append("file", blob, "profile.jpg");
  formData.append("messaging_product", "whatsapp");
  formData.append("type", mimeType);

  const uploadRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
  );
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) return Response.json({ error: uploadData.error?.message || "Error al subir imagen" }, { status: 400 });

  const profileRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", profile_picture_handle: uploadData.id }),
    }
  );
  const profileData = await profileRes.json();
  if (!profileRes.ok) return Response.json({ error: profileData.error?.message || "Error al actualizar perfil" }, { status: 400 });

  return Response.json({ success: true });
}
