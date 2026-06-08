import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";
import { supabase } from "./supabase.js";

const loginAttempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (entry.lockedUntil > now) return true;
  if (entry.count >= 10) {
    loginAttempts.set(ip, { count: 0, lockedUntil: now + 15 * 60 * 1000 });
    return true;
  }
  return false;
}

function recordFailedAttempt(ip) {
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  loginAttempts.set(ip, { count: entry.count + 1, lockedUntil: entry.lockedUntil });
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

function safeCompare(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(":");
    const inputHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return safeCompare(inputHash.padEnd(256), hash.padEnd(256));
  } catch {
    return false;
  }
}

async function findUserInSupabase(email, password) {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("users")
      .select("id, email, name, password_hash")
      .eq("email", email)
      .single();

    if (error || !data || !data.password_hash) return null;
    if (!verifyPassword(password, data.password_hash)) return null;

    return { id: data.id, email: data.email, name: data.name || data.email.split("@")[0] };
  } catch {
    return null;
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip =
          req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req?.headers?.["x-real-ip"] ||
          "unknown";

        if (isRateLimited(ip)) throw new Error("Demasiados intentos. Espera 15 minutos.");

        const email    = (credentials?.email    || "").trim().toLowerCase();
        const password = (credentials?.password || "").trim();

        if (!email || !password) { recordFailedAttempt(ip); return null; }

        // 1. Try Supabase users table first (multi-user)
        const supabaseUser = await findUserInSupabase(email, password);
        if (supabaseUser) {
          clearAttempts(ip);
          return supabaseUser;
        }

        // 2. Fallback: check ADMIN_EMAIL / ADMIN_PASSWORD env vars
        const adminEmail    = (process.env.ADMIN_EMAIL || "").toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD || "";

        if (adminEmail && adminPassword) {
          const emailMatch = safeCompare(email.padEnd(256), adminEmail.padEnd(256));
          const passMatch  = safeCompare(password.padEnd(256), adminPassword.padEnd(256));
          if (emailMatch && passMatch) {
            clearAttempts(ip);
            return { id: adminEmail, email: adminEmail, name: adminEmail.split("@")[0] };
          }
        }

        recordFailedAttempt(ip);
        return null;
      },
    }),
  ],
  pages: {
    signIn:  "/sign-in",
    signUp:  "/sign-up",
  },
  session: {
    strategy: "jwt",
    maxAge:   7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.email = user.email; token.name = user.name; }
      return token;
    },
    async session({ session, token }) {
      session.user.id    = token.id;
      session.user.email = token.email;
      session.user.name  = token.name;
      return session;
    },
  },
};
