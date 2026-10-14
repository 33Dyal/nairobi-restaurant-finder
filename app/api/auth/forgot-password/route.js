import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody } from "@/lib/utils/api";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { sendPasswordResetEmail, runSafely } from "@/lib/auth/emails";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const { email } = await parseBody(request, forgotPasswordSchema);
    enforceRateLimit(`forgot:${ip}:${email}`, 3, 60 * 60 * 1000);
    enforceRateLimit(`forgot:ip:${ip}`, 10, 60 * 60 * 1000);

    // The response is the same whether or not the account exists, so this
    // endpoint can't be used to find out who has an account.
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt && user.status === "ACTIVE") {
      after(() => runSafely(() => sendPasswordResetEmail(user)));
    }

    return ok({ message: "If an account exists for that email, we've sent a reset link." });
  } catch (error) {
    return handleError(error);
  }
}