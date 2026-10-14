import "server-only";
import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

// Rule: a restaurant is public only once an admin has approved it.
export const PUBLIC_RESTAURANT = { approvalStatus: "APPROVED", deletedAt: null };

const activeOffer = (now) => ({
  deletedAt: null, isActive: true, status: "APPROVED", startsAt: { lte: now }, endsAt: { gte: now },
});

export function cardSelect(now) {
  const from = new Date(now.getTime() - 2 * 86400000);
  const to = new Date(now.getTime() + 3 * 86400000);
  return {
    id: true, slug: true, name: true, shortDescription: true, coverUrl: true, logoUrl: true,
    priceRange: true, averageRating: true, reviewCount: true, isFeatured: true, isDemo: true,
    verificationStatus: true, operatingStatus: true,
    area: { select: { name: true, slug: true } },
    cuisines: { select: { isPrimary: true, cuisine: { select: { name: true, slug: true } } }, orderBy: { isPrimary: "desc" } },
    openingPeriods: { select: { dayOfWeek: true, opensAt: true, closesAt: true } },
    specialHours: { where: { date: { gte: from, lte: to } }, select: { date: true, isClosed: true, opensAt: true, closesAt: true } },
    offers: { where: activeOffer(now), select: { title: true }, take: 1 },
  };
}

// Converts a database row into the plain object RestaurantCard expects.
export function toCard(row) {
  return {
    id: row.id, slug: row.slug, name: row.name, shortDescription: row.shortDescription,
    coverUrl: row.coverUrl, logoUrl: row.logoUrl, priceRange: row.priceRange,
    rating: { average: row.averageRating, count: row.reviewCount },
    isFeatured: row.isFeatured, isDemo: row.isDemo, verified: row.verificationStatus === "VERIFIED",
    areaName: row.area.name, areaSlug: row.area.slug,
    cuisines: row.cuisines.map((c) => c.cuisine.name),
    offerTitle: row.offers[0]?.title ?? null,
    schedule: {
      operatingStatus: row.operatingStatus,
      periods: row.openingPeriods.map((p) => [p.dayOfWeek, p.opensAt, p.closesAt]),
      special: row.specialHours.map((s) => ({ date: s.date.toISOString().slice(0, 10), closed: s.isClosed, opens: s.opensAt, closes: s.closesAt })),
    },
  };
}

async function listRestaurants({ where = {}, orderBy, take = 8 }, now = new Date()) {
  const rows = await prisma.restaurant.findMany({
    where: { ...PUBLIC_RESTAURANT, ...where }, orderBy, take, select: cardSelect(now),
  });
  return rows.map(toCard);
}

export const getFeatured = (take = 8) =>
  listRestaurants({ where: { isFeatured: true }, orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }], take });

export const getNewest = (take = 8) => listRestaurants({ orderBy: { createdAt: "desc" }, take });

export const getTopRated = (take = 8) =>
  listRestaurants({ where: { reviewCount: { gte: 3 } }, orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }], take });

// Trending = most discovery activity (profile views, search clicks, directions) in the last 14 days.
export async function getTrending(take = 8) {
  const now = new Date();
  const since = new Date(now.getTime() - 14 * 86400000);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["restaurantId"],
    where: { createdAt: { gte: since }, restaurantId: { not: null }, type: { in: ["PROFILE_VIEW", "SEARCH_CLICK", "DIRECTIONS_CLICK"] } },
    _count: { _all: true },
    orderBy: { _count: { restaurantId: "desc" } },
    take: take * 3,
  });
  const ids = grouped.map((g) => g.restaurantId);
  const rows = ids.length
    ? await prisma.restaurant.findMany({ where: { ...PUBLIC_RESTAURANT, id: { in: ids } }, select: cardSelect(now) })
    : [];
  const order = new Map(ids.map((id, i) => [id, i]));
  const trending = rows.sort((a, b) => order.get(a.id) - order.get(b.id)).slice(0, take).map(toCard);
  if (trending.length >= take) return trending;

  // Not enough activity yet: fill with the most viewed listings.
  const filler = await listRestaurants({
    where: { id: { notIn: trending.map((r) => r.id) } }, orderBy: [{ viewCount: "desc" }, { averageRating: "desc" }], take: take - trending.length,
  });
  return [...trending, ...filler];
}

export async function getFilterOptions() {
  const count = { select: { restaurants: { where: { restaurant: PUBLIC_RESTAURANT } } } };
  const [cuisines, areas, vibes] = await Promise.all([
    prisma.cuisine.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true, _count: count } }),
    prisma.area.findMany({
      where: { isActive: true, city: { slug: siteConfig.defaultCitySlug } }, orderBy: { name: "asc" },
      select: { name: true, slug: true, _count: { select: { restaurants: { where: PUBLIC_RESTAURANT } } } },
    }),
    prisma.vibe.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true, _count: count } }),
  ]);
  const shape = (rows) => rows.map((r) => ({ name: r.name, slug: r.slug, count: r._count.restaurants }));
  return { cuisines: shape(cuisines), areas: shape(areas), vibes: shape(vibes) };
}

export async function getCurrentOffers(take = 6) {
  const now = new Date();
  const rows = await prisma.offer.findMany({
    where: { ...activeOffer(now), restaurant: PUBLIC_RESTAURANT },
    orderBy: [{ isFeatured: "desc" }, { endsAt: "asc" }], take,
    select: { id: true, title: true, description: true, endsAt: true, restaurant: { select: { name: true, slug: true, area: { select: { name: true } } } } },
  });
  return rows.map((o) => ({
    id: o.id, title: o.title, description: o.description, endsAt: o.endsAt,
    restaurantName: o.restaurant.name, restaurantSlug: o.restaurant.slug, areaName: o.restaurant.area.name,
  }));
}

export async function getUpcomingEvents(take = 6) {
  const rows = await prisma.event.findMany({
    where: { deletedAt: null, isPublished: true, status: "APPROVED", startsAt: { gte: new Date() }, restaurant: PUBLIC_RESTAURANT },
    orderBy: { startsAt: "asc" }, take,
    select: { id: true, title: true, category: true, startsAt: true, restaurant: { select: { name: true, slug: true, area: { select: { name: true } } } } },
  });
  return rows.map((e) => ({
    id: e.id, title: e.title, category: e.category, startsAt: e.startsAt,
    restaurantName: e.restaurant.name, restaurantSlug: e.restaurant.slug, areaName: e.restaurant.area.name,
  }));
}

export async function getPopularSearches(take = 8) {
  const since = new Date(Date.now() - 30 * 86400000);
  const rows = await prisma.searchHistory.groupBy({
    by: ["normalized"], where: { createdAt: { gte: since }, resultCount: { gt: 0 } },
    _count: { _all: true }, orderBy: { _count: { normalized: "desc" } }, take,
  });
  return rows.map((r) => r.normalized);
}

export async function getHomepageData() {
  const [featured, trending, newest, topRated, filters, offers, events, popularSearches] = await Promise.all([
    getFeatured(), getTrending(), getNewest(), getTopRated(), getFilterOptions(), getCurrentOffers(), getUpcomingEvents(), getPopularSearches(),
  ]);
  return { featured, trending, newest, topRated, filters, offers, events, popularSearches };
}