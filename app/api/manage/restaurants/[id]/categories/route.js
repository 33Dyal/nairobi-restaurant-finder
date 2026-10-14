import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody, ApiError } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireRestaurantAccess } from "@/lib/auth/restaurant-access";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { writeAudit } from "@/lib/audit";
import { restaurantCategoriesSchema } from "@/lib/validation/restaurant-categories";

export async function PUT(request, { params }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user, isAdmin } = await requireRestaurantAccess(id);
    enforceRateLimit(`manage:${user.id}`, 60, 10 * 60 * 1000);

    const input = await parseBody(request, restaurantCategoriesSchema);

    const restaurant = await prisma.restaurant.findFirst({ where: { id, deletedAt: null }, select: { id: true, slug: true } });
    if (!restaurant) throw new ApiError(404, "Restaurant not found.");

    const cuisineIds = [...new Set(input.cuisineIds)];
    const vibeIds = [...new Set(input.vibeIds)];
    const amenityIds = [...new Set(input.amenityIds)];

    // Every id must be a real, active option.
    const [cuisines, vibes, amenities] = await Promise.all([
      prisma.cuisine.count({ where: { id: { in: cuisineIds }, isActive: true } }),
      prisma.vibe.count({ where: { id: { in: vibeIds }, isActive: true } }),
      prisma.amenity.count({ where: { id: { in: amenityIds }, isActive: true } }),
    ]);
    if (cuisines !== cuisineIds.length || vibes !== vibeIds.length || amenities !== amenityIds.length) {
      throw new ApiError(400, "One of those choices is no longer available. Please reload the page.");
    }

    const primary = cuisineIds.includes(input.primaryCuisineId) ? input.primaryCuisineId : cuisineIds[0];

    // Replace all three lists together, or none of them.
    await prisma.$transaction([
      prisma.restaurantCuisine.deleteMany({ where: { restaurantId: id } }),
      prisma.restaurantCuisine.createMany({
        data: cuisineIds.map((cuisineId) => ({ restaurantId: id, cuisineId, isPrimary: cuisineId === primary })),
      }),
      prisma.restaurantVibe.deleteMany({ where: { restaurantId: id } }),
      prisma.restaurantVibe.createMany({ data: vibeIds.map((vibeId) => ({ restaurantId: id, vibeId })) }),
      prisma.restaurantAmenity.deleteMany({ where: { restaurantId: id } }),
      prisma.restaurantAmenity.createMany({ data: amenityIds.map((amenityId) => ({ restaurantId: id, amenityId })) }),
    ]);

    await writeAudit({
      actorId: user.id,
      action: "restaurant.categories.update",
      entityType: "Restaurant",
      entityId: id,
      metadata: { cuisines: cuisineIds.length, vibes: vibeIds.length, amenities: amenityIds.length, via: isAdmin ? "admin" : "owner" },
      ipAddress: getClientIp(request),
    });

    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath(`/restaurants/${restaurant.slug}`);

    return ok({ cuisines: cuisineIds.length, vibes: vibeIds.length, amenities: amenityIds.length });
  } catch (error) {
    return handleError(error);
  }
}