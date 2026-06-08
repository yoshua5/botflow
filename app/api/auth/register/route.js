import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const db = supabase();

    // Check if user already exists
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
    }

    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    const { error } = await db.from("users").insert({
      id:            userId,
      email:         email.toLowerCase().trim(),
      name:          name || email.split("@")[0],
      password_hash: passwordHash,
      plan:          "free",
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    });

    if (error) {
      console.error("Register error:", error.message);
      return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error("Register error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
