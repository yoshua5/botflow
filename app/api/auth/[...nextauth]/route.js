import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

// ── Brute-force protection (in-memory per instance) ──────────
const loginAttempts = new Map(); // ip -> { count, lockedUntil }

function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (entry.lockedUntil > now) return true; // still locked
  if (entry.count >= 10) {
    // Lock for 15 minutes after 10 failed attempts
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

// ── Constant-time string comparison (prevent timing attacks) ──
function safeCompare(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email",