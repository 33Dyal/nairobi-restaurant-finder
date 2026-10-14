import { ok, handleError } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { revokeByToken } from "@/lib/auth/refresh-tokens";
import { clearAuthCookies, getRefreshCookie } from "@/lib/auth/cookies";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const token = await getRefreshCookie();
    if (token) await revokeByToken(token);
    await clearAuthCookies();
    return ok({ message: "Signed out." });
  } catch (error) {
    return handleError(error);
  }
}
