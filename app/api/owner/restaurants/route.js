import { prisma } from "@/lib/db/prisma";
import { ok, handleError, parseBody, ApiError } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireRole } from "@/lib/auth/current-user";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { writeAudit } from "@/lib/audit";
import { restaurantCreateSchema } from "@/lib/validation/owner";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(name) {
  const base = slugify(name) || "restaurant";
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const taken = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// Creates a listing that stays hidden (PENDING) until an admin approves it.
export async function POST(request) {
  try {
    assertSameOrigin(request);
    const user = await requireRole("OWNER", "ADMIN");
    if (!user.emailVerifiedAt) throw new ApiError(403, "Please verify your email address first.");
    enforceRateLimit(`owner-create:${user.id}`, 10, 60 * 60 * 1000);

    const input = await parseBody(request, restaurantCreateSchema);

    const area = await prisma.area.findFirst({
      where: { id: input.areaId, isActive: true },
      select: { id: true, cityId: true, latitude: true, longitude: true, city: { select: { latitude: true, longitude: true } } },
    });
    if (!area) throw new ApiError(400, "Please choose a valid area.");

    const slug = await uniqueSlug(input.name);

    const restaurant = await prisma.restaurant.create({
      data: {
        slug,
        name: input.name,
        shortDescription: input.shortDescription,
        description: input.description,
        cityId: area.cityId,
        areaId: area.id,
        address: input.address,
        landmark: input.landmark,
        // Pinned at the area centre for now; exact coordinates come with the editor.
        latitude: area.latitude ?? area.city.latitude,
        longitude: area.longitude ?? area.city.longitude,
        priceRange: input.priceRange,
        phone: input.phone,
        email: input.email,
        website: input.website,
        approvalStatus: "PENDING",
        verificationStatus: "PENDING",
        staff: { create: { userId: user.id, role: "OWNER" } },
      },
      select: { id: true, slug: true, name: true },
    });

    await writeAudit({
      actorId: user.id,
      action: "restaurant.create",
      entityType: "Restaurant",
      entityId: restaurant.id,
      metadata: { name: restaurant.name, slug: restaurant.slug, via: "owner" },
      ipAddress: getClientIp(request),
    });

    return ok(restaurant, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}