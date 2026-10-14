import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/utils/api";
import { getAccessCookie } from "./cookies";
import { verifyAccessToken } from "./jwt";
import { PUBLIC_USER_SELECT } from "./user";

export async function getSession() {
  const token = await getAccessCookie();
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload ? { userId: payload.sub, role: payload.role } : null;
}

// Always re-reads the user so suspended or deleted accounts lose access at once.
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findFirst({
    where: { id: session.userId, deletedAt: null, status: "ACTIVE" },
    select: PUBLIC_USER_SELECT,
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Please sign in to continue.");
  return user;
}

export async function requireRole(...roles) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ApiError(403, "You don't have permission to do that.");
  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) throw new ApiError(403, "Please verify your email address first.");
  return user;
}
