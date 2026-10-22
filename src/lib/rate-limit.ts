import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort fixed-window rate limiter kept in process memory. It throttles
 * abuse from a single client on a single server instance; it is not a
 * distributed limit. Supabase Auth and the database remain the real guards.
 */
type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Client IP from common proxy headers; falls back to a shared key when unknown. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

// Opportunistic cleanup so the map does not grow without bound.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, win] of buckets) if (win.resetAt <= now) buckets.delete(key);
  }, 60_000);
  timer.unref?.();
}
