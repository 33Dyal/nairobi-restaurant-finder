import { ok, handleError, ApiError } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { rotateRefreshToken } from "@/lib/auth/refresh-tokens";
import { setAuthCookies, clearAuthCookies, getRefreshCookie } from "@/lib/auth/cookies";
import { toPublicUser } from "@/lib/auth/user";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    enforceRateLimit(`refresh:${ip}`, 60, 60 * 1000);

    const token = await getRefreshCookie();
    if (!token) throw new ApiError(401, "You're not signed in.");

    try {
      const { user, ...tokens } = await rotateRefreshToken(token, { userAgent: request.headers.get("user-agent"), ipAddress: ip });
      await setAuthCookies(tokens);
      return ok({ user: toPublicUser(user) });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await clearAuthCookies();
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}
