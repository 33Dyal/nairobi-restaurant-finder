import { ApiError } from "@/lib/utils/api";

// Defence in depth on top of SameSite=Lax cookies: reject state-changing
// requests that browsers mark as coming from another site.
export function assertSameOrigin(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;

  const origin = request.headers.get("origin");
  if (origin) {
    const allowed = new Set([new URL(request.url).host]);
    if (process.env.NEXT_PUBLIC_APP_URL) allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host);
    let originHost;
    try { originHost = new URL(origin).host; } catch { originHost = null; }
    if (!originHost || !allowed.has(originHost)) throw new ApiError(403, "Request blocked.");
    return;
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "Request blocked.");
}
