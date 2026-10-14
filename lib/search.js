import "server-only";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_RESTAURANT, cardSelect, toCard, getFilterOptions } from "@/lib/data/public";
import { PAGE_SIZE, PRICES } from "@/lib/validation/search";

const ORDER = {
  rating: [{ averageRating: "desc" }, { reviewCount: "desc" }],
  newest: [{ createdAt: "desc" }],
  name: [{ name: "asc" }],
};

export async function getFacets() {
  return { ...(await getFilterOptions()), prices: PRICES };
}

// Filters combine with AND across groups and OR within a group.
function buildAnd({ q, cuisine, area, vibe, price, rating, featured }) {
  const and = [];
  if (q) {
    const m = { contains: q, mode: "insensitive" };
    and.push({ OR: [{ name: m }, { shortDescription: m }, { address: m }, { area: { name: m } }, { cuisines: { some: { cuisine: { name: m } } } }] });
  }
  if (cuisine.length) and.push({ cuisines: { some: { cuisine: { slug: { in: cuisine } } } } });
  if (vibe.length) and.push({ vibes: { some: { vibe: { slug: { in: vibe } } } } });
  if (area.length) and.push({ area: { slug: { in: area } } });
  const prices = price.filter((p) => PRICES.includes(p));
  if (prices.length) and.push({ priceRange: { in: prices } });
  if (rating > 0) and.push({ averageRating: { gte: rating } });
  if (featured) and.push({ isFeatured: true });
  return and;
}

// Same signals as the homepage "Trending" rail: views, search clicks, directions, last 14 days.
async function trendingScores() {
  const since = new Date(Date.now() - 14 * 86400000);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["restaurantId"],
    where: { createdAt: { gte: since }, restaurantId: { not: null }, type: { in: ["PROFILE_VIEW", "SEARCH_CLICK", "DIRECTIONS_CLICK"] } },
    _count: { _all: true },
    orderBy: { _count: { restaurantId: "desc" } },
    take: 500,
  });
  return new Map(grouped.map((g) => [g.restaurantId, g._count._all]));
}

export async function searchRestaurants(params) {
  const where = { ...PUBLIC_RESTAURANT, AND: buildAnd(params) };
  const now = new Date();
  const skip = (params.page - 1) * PAGE_SIZE;
  const total = await prisma.restaurant.count({ where });
  let rows;

  if (params.sort === "trending") {
    const [scores, all] = await Promise.all([
      trendingScores(),
      prisma.restaurant.findMany({ where, select: { id: true, viewCount: true }, take: 1000 }),
    ]);
    const ids = all
      .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || b.viewCount - a.viewCount)
      .slice(skip, skip + PAGE_SIZE)
      .map((r) => r.id);
    const found = await prisma.restaurant.findMany({ where: { id: { in: ids } }, select: cardSelect(now) });
    const pos = new Map(ids.map((id, i) => [id, i]));
    rows = found.sort((a, b) => pos.get(a.id) - pos.get(b.id));
  } else {
    rows = await prisma.restaurant.findMany({ where, orderBy: ORDER[params.sort], skip, take: PAGE_SIZE, select: cardSelect(now) });
  }
  return { items: rows.map(toCard), total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

// Feeds the homepage "Popular searches" (it reads normalized + resultCount).
export async function recordSearch({ q, ...filters }, resultCount, userId = null) {
  const normalized = q.toLowerCase().replace(/\s+/g, " ");
  if (normalized.length < 2) return;
  await prisma.searchHistory.create({ data: { userId, query: q, normalized, filters, resultCount } }).catch(() => {});
}

export async function suggest(q) {
  const m = { contains: q, mode: "insensitive" };
  const [restaurants, cuisines, areas] = await Promise.all([
    prisma.restaurant.findMany({ where: { ...PUBLIC_RESTAURANT, name: m }, orderBy: [{ viewCount: "desc" }], take: 5, select: { slug: true, name: true, area: { select: { name: true } } } }),
    prisma.cuisine.findMany({ where: { isActive: true, name: m }, take: 3, select: { name: true, slug: true } }),
    prisma.area.findMany({ where: { isActive: true, name: m }, take: 3, select: { name: true, slug: true } }),
  ]);
  return { restaurants, cuisines, areas };
}