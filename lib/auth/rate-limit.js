// In-memory sliding-window limiter. Good for local development and a single
// server. On Vercel each serverless instance has its own memory, so Phase 19
// replaces the store with a shared one (for example Upstash Redis).
import { ApiError } from "@/lib/utils/api";

const hits = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

export function enforceRateLimit(key, limit, windowMs) {
  const result = rateLimit(key, limit, windowMs);
  if (!result.ok) {
    throw new ApiError(429, `Too many attempts. Please try again in ${Math.ceil(result.retryAfter / 60)} minute(s).`);
  }
}

export function resetRateLimits() {
  hits.clear();
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}
