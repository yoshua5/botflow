/**
 * webhookAuth.js — Webhook security utilities
 *
 * Centralizes Meta signature verification and per-bot ownership HMAC.
 * Imported by both lib/storage.js (to write HMACs) and the webhook route (to verify them).
 * Kept in lib/ to avoid circular imports with app/api/.
 *
 * Required env vars:
 *   META_APP_SECRET  — From Meta Developer Console → App → Settings → Basic
 *   WEBHOOK_SECRET   — Random 32+ char string, stored only in Vercel env vars
 */

import crypto from "crypto";

// ── Meta payload signature ────────────────────────────────────

/**
 * Verify Meta's X-Hub-Signature-256 header against the raw POST body.
 * Uses timingSafeEqual to prevent timing attacks.
 *
 * @param {string} rawBody           - Raw UTF-8 request body (not parsed JSON)
 * @param {string|null} sigHeader    - Value of X-Hub-Signature-256 header
 * @returns {boolean}
 */
export function verifyMetaSignature(rawBody, sigHeader) {
  const appSecret = process.env.META_APP_SECRET;
  const isDev = process.env.NODE_ENV !== "production";
  // Skip verification if secret is missing, a placeholder, or we're in dev
  const isPlaceholder = !appSecret || appSecret.startsWith("your_") || appSecret.length < 16;
  if (isPlaceholder) {
    if (!isDev) {
      console.error("❌ META_APP_SECRET not properly set in production — rejecting all webhook messages.");
      return false;
    }
    console.warn("⚠️  META_APP_SECRET not set — skipping signature check in dev mode.");
    return true;
  }
  if (!sigHeader) {
    console.error("❌ Missing X-Hub-Signature-256 header");
    return false;
  }
  const expected = "sha256=" + crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ── Per-bot ownership HMAC ────────────────────────────────────

/**
 * Compute ownership HMAC for a phone_number_id → user_id binding.
 * Formula: HMAC-SHA256(phone_number_id + ":" + user_id, WEBHOOK_SECRET)
 *
 * Stored in phone_mappings.hmac_sig at registration time.
 * Verified on every incoming webhook message.
 *
 * @param {string} phoneNumberId
 * @param {string} userId
 * @returns {string|null} hex HMAC, or null if WEBHOOK_SECRET is not configured
 */
export function computeOwnershipHmac(phoneNumberId, userId) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "⚠️  WEBHOOK_SECRET not set — ownership HMAC disabled. " +
      "Set it in Vercel env vars to prevent phone number hijacking."
    );
    return null;
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${phoneNumberId}:${userId}`)
    .digest("hex");
}

/**
 * Verify that the stored HMAC matches the expected one for this phone+user pair.
 * Returns true if verification passes OR if the stored HMAC is null (legacy row
 * created before HMAC support was added — treated as trusted).
 *
 * @param {string} phoneNumberId
 * @param {string} userId
 * @param {string|null} storedHmac   - Value from phone_mappings.hmac_sig
 * @returns {boolean}
 */
export function verifyOwnershipHmac(phoneNumberId, userId, storedHmac) {
  // Legacy rows without an HMAC — skip check (they predated this feature).
  // Run a backfill script to add HMACs to all existing rows.
  if (!storedHmac) return true;

  c