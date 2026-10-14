import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody } from "@/lib/utils/api";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { sendVerificationEmail, sendAccountExistsEmail, runSafely } from "@/lib/auth/emails";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`register:${getClientIp(request)}`, 5, 60 * 60 * 1000);
    const { name, email, password } = await parseBody(request, registerSchema);

    // The response is identical whether or not the email is already registered,
    // so this endpoint can't be used to discover who has an account. The password
    // is hashed on both paths so response times don't give it away either.
    const passwordHash = await hashPassword(password);

    const existing = await prisma.user.findUnique({ where: { email } });
    let created = null;

    if (!existing) {
      try {
        created = await prisma.user.create({ data: { name, email, passwordHash, role: "CUSTOMER" } });
      } catch (error) {
        // P2002 = unique constraint: another signup with this email won the race.
        if (error?.code !== "P2002") throw error;
      }
    }

    if (created) {
      after(() => runSafely(() => sendVerificationEmail(created)));
    } else {
      const user = existing ?? (await prisma.user.findUnique({ where: { email } }));
      if (user && !user.deletedAt) {
        after(() => runSafely(() => sendAccountExistsEmail(user)));
      }
    }

    return ok({ message: "Check your email to verify your account." }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}