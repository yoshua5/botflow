/**
 * crypto.js — AES-256-GCM encryption for sensitive fields
 *
 * Ciphertext format: "v1:<base64(iv + ciphertext + authTag)>"
 * The "v1:" prefix enables future key rotation without breaking old values.
 *
 * ENCRYPTION_KEY must be a 64-char hex string (32 bytes).
 * Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Store ONLY in Vercel env vars — never in Supabase or git.
 *
 * Key rotation:
 *   1. Add ENCRYPTION_KEY_V2 to Vercel env vars.
 *   2. Update KEY_VERSIONS below with the new key.
 *   3. Run scripts/rotate-encryption-keys.js to re-encrypt all bot_secrets rows.
 *   4. Remove ENCRYPTION_KEY (v1) from Vercel env vars.
 */

import crypto from "crypto";

const ALGORITHM  = "aes-256-gcm";
const IV_LENGTH  = 12;   // 96-bit IV for GCM
const TAG_LENGTH = 16;
const CURRENT_VERSION = "v1";

/**
 * Map of version → hex key env var name.
 * Add future versions here during key rotation.
 */
const KEY_VERSIONS = {
  v1: "ENCRYPTION_KEY",
  // v2: "ENCRYPTION_KEY_V2",
};

function getKeyForVersion(version) {
  const envVar = KEY_VERSIONS[version];
  if (!envVar) throw new Error(`Unknown encryption key version: ${version}`);
  const hex = process.env[envVar];
  if (!hex || hex.length !== 64) {
    throw new Error(
      `${envVar} must be a 64-char hex string in Vercel env vars. ` +
      `Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns: "v1:<base64(iv[12] + ciphertext + authTag[16])>"
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;
  const key    = getKeyForVersion(CURRENT_VERSION);
  const iv     = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag       = cipher.getAuthTag();

  const payload = Buffer.concat([iv, encrypted, tag]).toString("base64");
  return `${CURRENT_VERSION}:${payload}`;
}

/**
 * Decrypt a value produced by encrypt().
 * Supports any version listed in KEY_VERSIONS.
 * Returns the original plaintext string, or null on failure.
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    // Parse version prefix. Values without prefix are treated as legacy v1 (no prefix).
    let version = "v1";
    let payload = ciphertext;
    const colonIdx = ciphertext.indexOf(":");
    if (colonIdx > 0 && KEY_VERSIONS[ciphertext.slice(0, colonIdx)]) {
      version = ciphertext.slice(0, colonIdx);
      payload = ciphertext.slice(colonIdx + 1);
    }

    const key = getKeyForVersion(version);
    const buf = Buffer.from(payload, "base64");

    const iv        = buf.subarray(0, IV_LENGTH);
    const tag       = buf.subarray(buf.length - TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final("utf8");
  } catch (err) {
    console.error("decrypt() failed:", err.message);
    return null;
  }
}

/**
 * Returns true if the ciphertext was encrypted with a non-current key version.
 * Use in rotate-encryption-keys.js to find rows that need re-encryption.
 */
export function needsReencryption(ciphertext) {
  if (!ciphertext) return false;
  const colonIdx = ciphertext.indexOf(":");
  if (colonIdx <= 0) return true; // legacy: no version prefix
  const version = ciphertext.slice(0, colonIdx);
  return version !== CURRENT_VERSION;
}

/**
 * safeEncrypt — FAILS LOUDLY if ENCRYPTION_KEY is missing.
 * Never silently stores plaintext. Callers must handle the thrown error.
 *
 * Only use this for fields where encryption is mandatory (API keys, tokens).
 * If the key is not configured, the operation must fail — not silently degrade.
 */
export function safeEncrypt(plaintext) {
  if (!plaintext) return null;
  // Intentionally NO try/catch. Let the error propagate so the caller
  // knows the secret was NOT saved rather than saved in plaintext.
  return encrypt(plaintext);
}

/**
 * safeDecrypt — returns null if decryption fails instead of throwing.
 * Safe to call when the value might be absent or the key might have changed.
 */
export function safeDecrypt(ciphertext) {
  if (!ciphertext) return null;
  try { return decrypt(ciphertext); }
  catch (err) {
    console.error("safeDecrypt() failed — key mismatch or corrupt data:", err.message);
    return null;
  }
}
