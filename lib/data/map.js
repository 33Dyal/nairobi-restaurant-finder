import "server-only";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_RESTAURANT } from "@/lib/data/public";

// Public, approved restaurants with valid coordinates, shaped for the map.
export async function getMapRestaurants(take = 500) {
  const rows = await prisma.restaurant.findMany({
    where: PUBLIC_RESTAURANT,
    orderBy: { name: "asc" },
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      priceRange: true,
      averageRating: true,
      reviewCount: true,
      area: { select: { name: true } },
    },
  });

  return rows
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      address: r.address,
      lat: r.latitude,
      lng: r.longitude,
      priceRange: r.priceRange,
      rating: r.averageRating,
      reviewCount: r.reviewCount,
      areaName: r.area?.name ?? "",
    }));
}