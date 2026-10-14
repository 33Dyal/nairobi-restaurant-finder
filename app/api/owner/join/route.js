import { prisma } from "@/lib/db/prisma";
import { ok, handleError } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireVerifiedUser } from "@/lib/auth/current-user";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { rotateRefreshToken } from "@/lib/auth/refresh-tokens";
import { setAuthCookies, getRefreshCookie } from "@/lib/auth/cookies";
import { writeAudit } from "@/lib/audit";

// Lets a signed-in customer with a verified email become an owner.
// The OWNER role only opens the owner dashboard. Every listing they add stays
// hidden until an admin approves it.
export async function POST(request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedUser();
    const ip = getClientIp(request);
    enforceRateLimit(`owner-join:${user.id}`, 5, 60 * 60 * 1000);

    if (user.role !== "CUSTOMER") {
      // Already an owner or an admin: nothing to change.
      return ok({ role: user.role, relogin: false });
    }

    await prisma.user.update({ where: { id: user.id }, data: { role: "OWNER" } });

    await writeAudit({
      actorId: user.id,
      action: "user.become_owner",
      entityType: "User",
      entityId: user.id,
      metadata: { from: "CUSTOMER", to: "OWNER" },
      ipAddress: ip,
    });

    // The role is stored in the access token, so issue fresh cookies right away.
    // If that fails, the role change still stands and the user just signs in again.
    let relogin = false;
    try {
      const token = await getRefreshCookie();
      if (!token) throw new Error("no refresh cookie");
      const { user: _ignored, ...tokens } = await rotateRefreshToken(token, {
        userAgent: request.headers.get("user-agent"),
        ipAddress: ip,
      });
      await setAuthCookies(tokens);
    } catch {
      relogin = true;
    }

    return ok({ role: "OWNER", relogin });
  } catch (error) {
    return handleError(error);
  }
}
