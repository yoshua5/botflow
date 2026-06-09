import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { name, password } = await req.json();

  const supabase = db();
  const updates = {};
  if (name) updates.name = name;
  if (password) {
    if (password.length < 6) return Response.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    updates.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updates).length === 0) return Response.json({ success: true });

  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
