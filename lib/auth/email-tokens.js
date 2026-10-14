import { prisma } from "@/lib/db/prisma";
import { randomToken, hashToken } from "./crypto";
import { VERIFY_EMAIL_TTL_SECONDS, RESET_PASSWORD_TTL_SECONDS } from "./constants";

const TTL = { VERIFY_EMAIL: VERIFY_EMAIL_TTL_SECONDS, RESET_PASSWORD: RESET_PASSWORD_TTL_SECONDS };

// Returns the raw token (emailed to the user). Only its hash is stored.
export async function createEmailToken(userId, type) {
  await prisma.emailToken.deleteMany({ where: { userId, type, usedAt: null } });
  const token = randomToken();
  await prisma.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TTL[type] * 1000),
    },
  });
  return token;
}

// Single use: returns the user id, or null if the token is invalid, used or expired.
export async function consumeEmailToken(token, type) {
  const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt <= new Date()) return null;
  const claimed = await prisma.emailToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return claimed.count === 1 ? record.userId : null;
}
