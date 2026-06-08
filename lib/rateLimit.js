/**
 * rateLimit.js — In-memory rate limiter for API routes
 *
 * Usage:
 *   import { rateLimit } from "@/lib/rateLimit";
 *   const limited = rateLimit(request, { max: 10, windowMs: 60_000 });
 *   if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *
 * For production with multiple Vercel instances, swap the Map for Redis/Vercel KV.
 */

const store = new Map(); // ip -> { count, resetAt }

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (val.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * @param {Request} request
 * @param {{ max?: number, windowMs?: number }} options
 * @returns {boolean} true = rate limited (should return 429)
 */
export function rateLimit(request, { max = 20, windowMs = 60_000 } = {}) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const key = `${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > max) return true;
  return false;
}

/**
 * Rate limit keyed by IP + route (more granular)
 */
export function rateLimitRoute(request, route, { max = 20, windowMs = 60_000 } = {}) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const key = `${route}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > max) return true;
  return false;
}
