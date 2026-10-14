import { prisma } from "@/lib/db/prisma";
import { PUBLIC_RESTAURANT } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/seo";

// Rebuilt at most once an hour.
export const revalidate = 3600;

const STATIC_PAGES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/explore", changeFrequency: "daily", priority: 0.9 },
  { path: "/map", changeFrequency: "weekly", priority: 0.7 },
  { path: "/offers", changeFrequency: "daily", priority: 0.7 },
  { path: "/events", changeFrequency: "daily", priority: 0.7 },
  { path: "/list-your-restaurant", changeFrequency: "monthly", priority: 0.5 },
  { path: "/recommend", changeFrequency: "monthly", priority: 0.4 },
];

export default async function sitemap() {
  // Only approved restaurants that are open for business. Sample (demo) listings
  // are left out, because their pages are marked noindex.
  const restaurants = await prisma.restaurant.findMany({
    where: { ...PUBLIC_RESTAURANT, isDemo: false, operatingStatus: { not: "PERMANENTLY_CLOSED" } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 50000,
  });

  return [
    ...STATIC_PAGES.map((p) => ({
      url: absoluteUrl(p.path),
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...restaurants.map((r) => ({
      url: absoluteUrl(`/restaurants/${r.slug}`),
      lastModified: r.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];
}
