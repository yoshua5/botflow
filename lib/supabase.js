/**
 * supabase.js — Server-side Supabase client
 *
 * Uses SERVICE_ROLE key — bypasses RLS for server operations.
 * NEVER expose this client or key to the browser.
 *
 * For client-side use (future), create a separate client with ANON key
 * so RLS is enforced automatically.
 */

import { createClient } from "@supabase/supabase-js";

let _client = null;

export function supabase() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role — bypasses RLS

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env vars. " +
      "Get them from: supabase.com → your project → Settings → API"
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false }, // server-side: no session persistence
  });

  return _client;
}

/**
 * Ensure a user row exists in public.users.
 * Call this on first login / any authenticated request.
 */
export async function ensureUser(userId, email) {
  if (!userId) return;
  const db = supabase();
  const { error } = await db.from("users").upsert(
    { id: userId, email, updated_at: new Date().toISOString() },
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (error && error.code !== "23505") { // ignore unique violation
    console.error("ensureUser error:", error.message);
  }
}
