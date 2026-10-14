import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/utils/api";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";
import { hashToken } from "./crypto";
import { REFRESH_TTL_SECONDS, REFRESH_GRACE_MS } from "./constants";

const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

async function createTokenPair(db, user, { familyId, userAgent, ipAddress }) {
  const refreshToken = await signRefreshToken({ sub: user.id, fid: familyId, jti: randomUUID() });
  const record = await db.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
      userAgent: userAgent ? userAgent.slice(0, 255) : null,
      ipAddress: ipAddress ?? null,
    },
  });
  const accessToken = await signAccessToken({ sub: user.id, role: user.role });
  return { accessToken, refreshToken, recordId: record.id };
}

// Starts a brand-new session (a new token "family") after login.
export function issueSession(user, meta = {}) {
  return createTokenPair(prisma, user, { familyId: randomUUID(), ...meta });
}

export function revokeFamily(familyId) {
  return prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function revokeAllForUser(userId) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeByToken(token) {
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (record) await revokeFamily(record.familyId);
}

// Refresh token rotation with reuse detection: every refresh invalidates the
// presented token. Presenting an already-used token means it may have been
// stolen, so the whole family is revoked. A short grace period tolerates two
// near-simultaneous refreshes (for example two tabs) without logging the user out.
export async function rotateRefreshToken(token, meta = {}) {
  const payload = await verifyRefreshToken(token);
  if (!payload) throw new ApiError(401, SESSION_EXPIRED);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record) throw new ApiError(401, SESSION_EXPIRED);

  if (record.revokedAt) {
    const justRotated = record.replacedById && Date.now() - record.revokedAt.getTime() < REFRESH_GRACE_MS;
    if (!justRotated) await revokeFamily(record.familyId);
    throw new ApiError(401, SESSION_EXPIRED);
  }
  if (record.expiresAt <= new Date()) throw new ApiError(401, SESSION_EXPIRED);

  const user = record.user;
  if (user.deletedAt || user.status !== "ACTIVE") {
    await revokeFamily(record.familyId);
    throw new ApiError(401, SESSION_EXPIRED);
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count === 0) throw new ApiError(401, SESSION_EXPIRED);
    const pair = await createTokenPair(tx, user, { familyId: record.familyId, ...meta });
    await tx.refreshToken.update({ where: { id: record.id }, data: { replacedById: pair.recordId } });
    return { user, ...pair };
  });
}
