import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody, ApiError } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireRestaurantAccess } from "@/lib/auth/restaurant-access";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { writeAudit } from "@/lib/audit";
import { restaurantHoursSchema, todayInNairobi } from "@/lib/validation/restaurant-hours";

export async function PUT(request, { params }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user, isAdmin } = await requireRestaurantAccess(id);
    enforceRateLimit(`manage:${user.id}`, 60, 10 * 60 * 1000);

    const input = await parseBody(request, restaurantHoursSchema);

    const restaurant = await prisma.restaurant.findFirst({ where: { id, deletedAt: null }, select: { id: true, slug: true } });
    if (!restaurant) throw new ApiError(404, "Restaurant not found.");

    const today = todayInNairobi();
    if (input.special.some((s) => s.date < today)) {
      throw new ApiError(400, "Special hours can't be set for a date that has already passed.");
    }
    const todayDate = new Date(`${today}T00:00:00Z`);

    // Weekly hours are replaced as a whole. Special days from today onwards are
    // replaced too; earlier ones are left alone as history.
    await prisma.$transaction([
      prisma.openingPeriod.deleteMany({ where: { restaurantId: id } }),
      prisma.openingPeriod.createMany({
        data: input.periods.map((p) => ({ restaurantId: id, dayOfWeek: p.day, opensAt: p.opens, closesAt: p.closes })),
      }),
      prisma.specialHours.deleteMany({ where: { restaurantId: id, date: { gte: todayDate } } }),
      prisma.specialHours.createMany({
        data: input.special.map((s) => ({
          restaurantId: id,
          date: new Date(`${s.date}T00:00:00Z`),
          type: s.type,
          label: s.label,
          isClosed: s.closed,
          opensAt: s.closed ? null : s.opens,
          closesAt: s.closed ? null : s.closes,
        })),
      }),
    ]);

    await writeAudit({
      actorId: user.id,
      action: "restaurant.hours.update",
      entityType: "Restaurant",
      entityId: id,
      metadata: { periods: input.periods.length, specialDays: input.special.length, via: isAdmin ? "admin" : "owner" },
      ipAddress: getClientIp(request),
    });

    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath(`/restaurants/${restaurant.slug}`);

    return ok({ periods: input.periods.length, specialDays: input.special.length });
  } catch (error) {
    return handleError(error);
  }
}