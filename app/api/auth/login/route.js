import { prisma } from "@/lib/db/prisma";
import { ok, fail, handleError, parseBody } from "@/lib/utils/api";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword, verifyAgainstDummy } from "@/lib/auth/password";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { issueSession } from "@/lib/auth/refresh-tokens";
import { setAuthCookies } from "@/lib/auth/cookies";
import { toPublicUser } from "@/lib/auth/user";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const { email, password } = await parseBody(request, loginSchema);
    enforceRateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
    enforceRateLimit(`login:${ip}:${email}`, 8, 15 * 60 * 1000);

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && !user.deletedAt ? await verifyPassword(password, user.passwordHash) : await verifyAgainstDummy(password);
    if (!valid) return fail("Incorrect email or password.", 401);
    if (user.status === "SUSPENDED") return fail("This account has been suspended. Contact support for help.", 403);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await issueSession(user, { userAgent: request.headers.get("user-agent"), ipAddress: ip });
    await setAuthCookies(tokens);
    return ok({ user: toPublicUser(user) });
  } catch (error) {
    return handleError(error);
  }
}
