import "server-only";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_RESTAURANT } from "@/lib/data/public";

const DISCOVERY_PAGE_SIZE = 12;

function paginate(page) {
  return { skip: (page - 1) * DISCOVERY_PAGE_SIZE, take: DISCOVERY_PAGE_SIZE };
}

// The cards read flat fields (restaurantName, restaurantSlug, areaName),
// but Prisma returns a nested `restaurant` object. Flatten it here.
const cardRestaurant = {
  select: { name: true, slug: true, area: { select: { name: true } } },
};

function flattenRestaurant(row) {
  const { restaurant, ...rest } = row;
  return {
    ...rest,
    restaurantName: restaurant?.name ?? "",
    restaurantSlug: restaurant?.slug ?? null,
    areaName: restaurant?.area?.name ?? "",
  };
}

export async function listOffers({ page = 1, now = new Date() } = {}) {
  const where = {
    status: "APPROVED",
    isActive: true,
    deletedAt: null,
    startsAt: { lte: now },
    endsAt: { gte: now },
    restaurant: PUBLIC_RESTAURANT,
  };
  const [total, rows] = await Promise.all([
    prisma.offer.count({ where }),
    prisma.offer.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { endsAt: "asc" }],
      include: { restaurant: cardRestaurant },
      ...paginate(page),
    }),
  ]);
  return {
    items: rows.map(flattenRestaurant),
    total,
    totalPages: Math.max(1, Math.ceil(total / DISCOVERY_PAGE_SIZE)),
  };
}

export async function listEvents({ page = 1, now = new Date() } = {}) {
  const where = {
    status: "APPROVED",
    isPublished: true,
    deletedAt: null,
    // Still running, or (no end time) starting in the future.
    OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }],
    restaurant: PUBLIC_RESTAURANT,
  };
  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { restaurant: cardRestaurant },
      ...paginate(page),
    }),
  ]);
  return {
    items: rows.map(flattenRestaurant),
    total,
    totalPages: Math.max(1, Math.ceil(total / DISCOVERY_PAGE_SIZE)),
  };
}