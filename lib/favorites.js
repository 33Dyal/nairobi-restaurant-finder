import "server-only";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_RESTAURANT, cardSelect, toCard } from "@/lib/data/public";

export async function getFavoriteIds(userId) {
  const rows = await prisma.favorite.findMany({ where: { userId }, select: { restaurantId: true } });
  return rows.map((r) => r.restaurantId);
}

// Idempotent: saving twice is harmless. Returns false if the restaurant isn't public.
export async function addFavorite(userId, restaurantId) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ...PUBLIC_RESTAURANT },
    select: { id: true },
  });
  if (!restaurant) return false;
  try {
    // Both writes succeed or neither does, so favoriteCount can't drift.
    await prisma.$transaction([
      prisma.favorite.create({ data: { userId, restaurantId } }),
      prisma.restaurant.update({ where: { id: restaurantId }, data: { favoriteCount: { increment: 1 } } }),
    ]);
  } catch (error) {
    if (error?.code !== "P2002") throw error; // already saved
  }
  return true;
}

export async function removeFavorite(userId, restaurantId) {
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.favorite.deleteMany({ where: { userId, restaurantId } });
    if (count > 0) {
      await tx.restaurant.update({ where: { id: restaurantId }, data: { favoriteCount: { decrement: count } } });
    }
  });
}

export async function listFavorites(userId) {
  const rows = await prisma.favorite.findMany({
    where: { userId, restaurant: PUBLIC_RESTAURANT },
    orderBy: { createdAt: "desc" },
    select: { restaurant: { select: cardSelect(new Date()) } },
  });
  return rows.map((r) => toCard(r.restaurant));
}