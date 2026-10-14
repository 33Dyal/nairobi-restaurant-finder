import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody, ApiError } from "@/lib/utils/api";
import { tokenSchema } from "@/lib/validation/auth";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { consumeEmailToken } from "@/lib/auth/email-tokens";
import { sendWelcomeEmail, runSafely } from "@/lib/auth/emails";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`verify:${getClientIp(request)}`, 20, 15 * 60 * 1000);
    const { token } = await parseBody(request, tokenSchema);

    const userId = await consumeEmailToken(token, "VERIFY_EMAIL");
    if (!userId) throw new ApiError(400, "This verification link is invalid or has expired.");

    // count === 1 only the first time the address is verified, so the welcome
    // email is sent once and never repeated.
    const { count } = await prisma.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });

    if (count === 1) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (user) after(() => runSafely(() => sendWelcomeEmail(user)));
    }

    return ok({ message: "Your email is verified." });
  } catch (error) {
    return handleError(error);
  }
}