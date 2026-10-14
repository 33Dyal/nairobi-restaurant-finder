import { prisma } from "@/lib/db/prisma";

export const live = { approvalStatus: "APPROVED", deletedAt: null };

export const select = {
  id: true, slug: true, name: true, shortDescription: true, priceRange: true,
  coverUrl: true, averageRating: true, reviewCount: true,
  area: { select: { name: true } },
  cuisines: { where: { isPrimary: true }, take: 1, select: { cuisine: { select: { name: true } } } },
  images: { where: { status: "APPROVED" }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
};

export const shape = (r) => ({
  id: r.id, slug: r.slug, name: r.name, blurb: r.shortDescription, price: r.priceRange,
  rating: r.averageRating, reviews: r.reviewCount, area: r.area?.name,
  cuisine: r.cuisines[0]?.cuisine.name, image: r.coverUrl || r.images[0]?.url || null,
});

const list = (where, orderBy, take = 8) =>
  prisma.restaurant.findMany({ where: { ...live, ...where }, orderBy, take, select }).then((rows) => rows.map(shape));

export async function getHomeData() {
  try {
    const [cuisines, featured, trending, newest] = await Promise.all([
      prisma.cuisine.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 10, select: { name: true, slug: true } }),
      list({ isFeatured: true }, [{ averageRating: "desc" }, { reviewCount: "desc" }]),
      list({}, [{ viewCount: "desc" }, { favoriteCount: "desc" }]),
      list({}, { createdAt: "desc" }),
    ]);
    return { cuisines, featured, trending, newest };
  } catch (error) {
    console.error("[HOME] Failed to load restaurants:", error);
    return { cuisines: [], featured: [], trending: [], newest: [] };
  }
}