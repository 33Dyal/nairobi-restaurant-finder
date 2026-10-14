import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_RESTAURANT } from "@/lib/data/public";

const DAY = 86400000;

// cache() means generateMetadata and the page share one query per request.
export const getRestaurantBySlug = cache(async (slug) => {
  const now = new Date();
  const r = await prisma.restaurant.findFirst({
    where: { slug, ...PUBLIC_RESTAURANT },
    select: {
      id: true, slug: true, name: true, shortDescription: true, description: true,
      address: true, landmark: true, latitude: true, longitude: true,
      priceRange: true, phone: true, email: true, website: true,
      instagramUrl: true, facebookUrl: true, twitterUrl: true, tiktokUrl: true,
      coverUrl: true, logoUrl: true, parkingInfo: true, accessibilityInfo: true,
      verificationStatus: true, operatingStatus: true,
      averageRating: true, reviewCount: true, isFeatured: true, isDemo: true,
      area: { select: { name: true, slug: true } },
      cuisines: { select: { isPrimary: true, cuisine: { select: { name: true, slug: true } } }, orderBy: { isPrimary: "desc" } },
      vibes: { select: { vibe: { select: { name: true, slug: true } } } },
      amenities: { select: { amenity: { select: { name: true, category: true } } } },
      openingPeriods: { select: { dayOfWeek: true, opensAt: true, closesAt: true } },
      specialHours: {
        where: { date: { gte: new Date(now.getTime() - 2 * DAY), lte: new Date(now.getTime() + 30 * DAY) } },
        orderBy: { date: "asc" },
        select: { date: true, label: true, isClosed: true, opensAt: true, closesAt: true },
      },
      images: {
        where: { status: "APPROVED" },
        orderBy: { sortOrder: "asc" },
        take: 12,
        select: { id: true, url: true, type: true, caption: true },
      },
      offers: {
        where: { deletedAt: null, isActive: true, status: "APPROVED", startsAt: { lte: now }, endsAt: { gte: now } },
        orderBy: [{ isFeatured: "desc" }, { endsAt: "asc" }],
        take: 6,
        select: { id: true, title: true, description: true, endsAt: true },
      },
      events: {
        where: { deletedAt: null, isPublished: true, status: "APPROVED", startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 6,
        select: { id: true, title: true, category: true, startsAt: true },
      },
      menus: {
        where: { isActive: true, deletedAt: null },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, name: true,
          categories: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true, name: true,
              items: {
                where: { deletedAt: null },
                orderBy: { sortOrder: "asc" },
                select: { id: true, name: true, description: true, price: true, dietaryTags: true, isAvailable: true, isSpicy: true },
              },
            },
          },
        },
      },
    },
  });
  if (!r) return null;

  const card = { restaurantName: r.name, restaurantSlug: r.slug, areaName: r.area.name };
  const special = r.specialHours.map((s) => ({
    date: s.date.toISOString().slice(0, 10), label: s.label, closed: s.isClosed, opens: s.opensAt, closes: s.closesAt,
  }));

  return {
    ...r,
    cuisines: r.cuisines.map((c) => c.cuisine.name),
    vibes: r.vibes.map((v) => v.vibe),
    amenities: r.amenities.map((a) => a.amenity),
    verified: r.verificationStatus === "VERIFIED",
    schedule: {
      operatingStatus: r.operatingStatus,
      periods: r.openingPeriods.map((p) => [p.dayOfWeek, p.opensAt, p.closesAt]),
      special,
    },
    offers: r.offers.map((o) => ({ ...o, ...card })),
    events: r.events.map((e) => ({ ...e, ...card })),
    // Prisma Decimal -> plain number so it renders and serialises cleanly.
    menus: r.menus
      .map((m) => ({
        ...m,
        categories: m.categories
          .map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, price: Number(i.price) })) }))
          .filter((c) => c.items.length > 0),
      }))
      .filter((m) => m.categories.length > 0),
  };
});

// Best-effort: never lets an analytics failure break the page.
export async function recordProfileView(restaurantId) {
  try {
    await prisma.$transaction([
      prisma.analyticsEvent.create({ data: { type: "PROFILE_VIEW", restaurantId, source: "web" } }),
      prisma.restaurant.update({ where: { id: restaurantId }, data: { viewCount: { increment: 1 } } }),
    ]);
  } catch (error) {
    console.error("[analytics] profile view failed:", error);
  }
}