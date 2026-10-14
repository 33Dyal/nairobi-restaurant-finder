import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody, ApiError } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireRestaurantAccess } from "@/lib/auth/restaurant-access";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { writeAudit } from "@/lib/audit";
import { restaurantDetailsSchema } from "@/lib/validation/restaurant-editor";

// One endpoint for both dashboards. requireRestaurantAccess lets through admins
// and staff of this restaurant only; anyone else gets a 404.
export async function PATCH(request, { params }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user, isAdmin } = await requireRestaurantAccess(id);
    enforceRateLimit(`manage:${user.id}`, 60, 10 * 60 * 1000);

    const input = await parseBody(request, restaurantDetailsSchema);

    const existing = await prisma.restaurant.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new ApiError(404, "Restaurant not found.");

    const area = await prisma.area.findFirst({
      where: { id: input.areaId, isActive: true },
      select: { id: true, cityId: true },
    });
    if (!area) throw new ApiError(400, "Please choose a valid area.");

    const { areaId, ...details } = input;
    const updated = await prisma.restaurant.update({
      where: { id },
      data: { ...details, areaId: area.id, cityId: area.cityId },
      select: { id: true, slug: true, name: true },
    });

    await writeAudit({
      actorId: user.id,
      action: "restaurant.details.update",
      entityType: "Restaurant",
      entityId: id,
      metadata: { name: updated.name, via: isAdmin ? "admin" : "owner" },
      ipAddress: getClientIp(request),
    });

    // Public pages are cached, so refresh the ones this change affects.
    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/map");
    revalidatePath(`/restaurants/${updated.slug}`);

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}