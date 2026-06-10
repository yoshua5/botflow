import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = db();
  const { data } = await supabase.from("users").select("name, email, whatsapp_phone").eq("id", session.user.id).single();
  return Response.json({ name: data?.name || "", email: data?.email || "", whatsapp_phone: data?.whatsapp_phone || "" });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { name, password, whatsapp_phone } = await req.json();

  const supabase = db();
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (whatsapp_phone !== undefined) updates.whatsapp_phone = whatsapp_phone || null;
  if (password) {
    if (password.length < 6) return Response.json({ error: "La contrasena debe tener al menos 6 caracteres" }, { status: 400 });
    updates.password_hash = hashPassword(password);
  }

  if (Object.keys(updates).length === 0) return Response.json({ success: true });

  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
