import "server-only";
import { prisma } from "@/lib/db/prisma";
import { todayInNairobi } from "@/lib/validation/restaurant-hours";

// Everything the editor shows for one restaurant. Used by both /owner and /admin pages.
export function getRestaurantForEditor(id) {
  return prisma.restaurant.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      description: true,
      areaId: true,
      address: true,
      landmark: true,
      latitude: true,
      longitude: true,
      priceRange: true,
      operatingStatus: true,
      phone: true,
      email: true,
      website: true,
      instagramUrl: true,
      facebookUrl: true,
      twitterUrl: true,
      tiktokUrl: true,
      parkingInfo: true,
      accessibilityInfo: true,
      approvalStatus: true,
    },
  });
}

export function getEditorAreas() {
  return prisma.area.findMany({
    where: { isActive: true, city: { isActive: true } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// Every cuisine, vibe and amenity that can be chosen, plus what this restaurant has now.
export async function getCategoryEditorData(restaurantId) {
  const [cuisines, vibes, amenities, ownCuisines, ownVibes, ownAmenities] = await Promise.all([
    prisma.cuisine.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.vibe.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.amenity.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true },
    }),
    prisma.restaurantCuisine.findMany({ where: { restaurantId }, select: { cuisineId: true, isPrimary: true } }),
    prisma.restaurantVibe.findMany({ where: { restaurantId }, select: { vibeId: true } }),
    prisma.restaurantAmenity.findMany({ where: { restaurantId }, select: { amenityId: true } }),
  ]);

  return {
    options: { cuisines, vibes, amenities },
    selected: {
      cuisineIds: ownCuisines.map((c) => c.cuisineId),
      primaryCuisineId: ownCuisines.find((c) => c.isPrimary)?.cuisineId ?? ownCuisines[0]?.cuisineId ?? "",
      vibeIds: ownVibes.map((v) => v.vibeId),
      amenityIds: ownAmenities.map((a) => a.amenityId),
    },
  };
}

// Weekly periods plus upcoming special days, in the shape the hours form uses.
export async function getHoursEditorData(restaurantId) {
  const today = new Date(`${todayInNairobi()}T00:00:00Z`);
  const [periods, special] = await Promise.all([
    prisma.openingPeriod.findMany({
      where: { restaurantId },
      orderBy: [{ dayOfWeek: "asc" }, { opensAt: "asc" }],
      select: { dayOfWeek: true, opensAt: true, closesAt: true },
    }),
    prisma.specialHours.findMany({
      where: { restaurantId, date: { gte: today } },
      orderBy: { date: "asc" },
      select: { date: true, type: true, label: true, isClosed: true, opensAt: true, closesAt: true },
    }),
  ]);

  return {
    periods: periods.map((p) => ({ day: p.dayOfWeek, opens: p.opensAt, closes: p.closesAt })),
    special: special.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      type: s.type,
      label: s.label ?? "",
      closed: s.isClosed,
      opens: s.opensAt ?? "",
      closes: s.closesAt ?? "",
    })),
  };
}