import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody, ApiError } from "@/lib/utils/api";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { consumeEmailToken } from "@/lib/auth/email-tokens";
import { revokeAllForUser } from "@/lib/auth/refresh-tokens";
import { writeAudit } from "@/lib/audit";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    enforceRateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
    const { token, password } = await parseBody(request, resetPasswordSchema);

    const userId = await consumeEmailToken(token, "RESET_PASSWORD");
    if (!userId) throw new ApiError(400, "This reset link is invalid or has expired. Request a new one.");

    // Following the emailed link also proves the user controls the address.
    await prisma.user.updateMany({ where: { id: userId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
    // Sign out everywhere: anyone holding an old session loses it.
    await revokeAllForUser(userId);
    await writeAudit({ actorId: userId, action: "auth.password_reset", entityType: "User", entityId: userId, ipAddress: ip });

    return ok({ message: "Your password has been updated. You can sign in now." });
  } catch (error) {
    return handleError(error);
  }
}
