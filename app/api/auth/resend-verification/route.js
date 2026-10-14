import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody } from "@/lib/utils/api";
import { resendVerificationSchema } from "@/lib/validation/auth";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { sendVerificationEmail } from "@/lib/auth/emails";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const { email } = await parseBody(request, resendVerificationSchema);
    enforceRateLimit(`resend:${ip}:${email}`, 3, 60 * 60 * 1000);

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt && user.status === "ACTIVE" && !user.emailVerifiedAt) {
      after(() => sendVerificationEmail(user));
    }
    return ok({ message: "If that account needs verifying, we've sent a new link." });
  } catch (error) {
    return handleError(error);
  }
}
