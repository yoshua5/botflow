import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const SUPER_ADMIN_EMAIL = "yoshualeisorek17@gmail.com";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}

export function isAdmin(email) {
  return email === SUPER_ADMIN_EMAIL;
}

export async function logAdminAction(adminEmail, action, targetUserId = null, details = {}) {
  try {
    const db = supabase();
    await db.from("admin_audit_log").insert({
      admin_email: adminEmail,
      action,
      target_user_id: targetUserId,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("⚠️ Failed to log admin action:", e.message);
  }
}
