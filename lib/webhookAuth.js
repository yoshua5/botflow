/**
 * webhookAuth.js - Webhook security utilities
 *
 * Required env vars:
 *   META_APP_SECRET  - From Meta Developer Console
 *   WEBHOOK_SECRET   - Random 32+ char string
 */

import crypto from "crypto";

export function verifyMetaSignature(rawBody, sigHeader) {
  const appSecret = process.env.META_APP_SECRET;
  const isDev = process.env.NODE_ENV !== "production";
  const isPlaceholder = !appSecret || appSecret.startsWith("your_") || appSecret.length < 16;
  if (isPlaceholder) {
    if (!isDev) {
      console.error("META_APP_SECRET not properly set in production -- rejecting webhook.");
      return false;
    }
    console.warn("META_APP_SECRET not set -- skipping signature check in dev mode.");
    return true;
  }
  if (!sigHeader) {
    console.error("Missing X-Hub-Signature-256 header");
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

export function computeOwnershipHmac(phoneNumberId, userId) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.warn("WEBHOOK_SECRET not set -- ownership HMAC disabled.");
    return null;
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${phoneNumberId}:${userId}`)
    .digest("hex");
}

export function verifyOwnershipHmac(phoneNumberId, userId, storedHmac) {
  if (!storedHmac) return true;
  const expected = computeOwnershipHmac(phoneNumberId, userId);
  if (!expected) return true;
  try {
    return crypto.timingSafeEqual(Buffer.from(storedHmac), Buffer.from(expected));
  } catch {
    return false;
  }
}
