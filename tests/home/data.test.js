import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const prisma = {
  restaurant: { findMany: vi.fn(async () => []) },
  analyticsEvent: { groupBy: vi.fn(async () => []) },
  offer: { findMany: vi.fn(async () => []) },
  event: { findMany: vi.fn(async () => []) },
  cuisine: { findMany: vi.fn(async () => []) },
  area: { findMany: vi.fn(async () => []) },
  vibe: { findMany: vi.fn(async () => []) },
  searchHistory: { groupBy: vi.fn(async () => []) },
};
vi.mock("@/lib/db/prisma", () => ({ prisma }));

const data = await import("@/lib/data/public");

beforeEach(() => Object.values(prisma).forEach((t) => Object.values(t).forEach((fn) => fn.mockClear())));

const approved = { approvalStatus: "APPROVED", deletedAt: null };

describe("only approved, non-deleted restaurants are public", () => {
  it("applies the rule to every restaurant list", async () => {
    await data.getFeatured(); await data.getNewest(); await data.getTopRated(); await data.getTrending();
    expect(prisma.restaurant.findMany.mock.calls.length).toBeGreaterThanOrEqual(4);
    for (const [args] of prisma.restaurant.findMany.mock.calls) expect(args.where).toMatchObject(approved);
  });

  it("applies it to offers and events through their restaurant", async () => {
    await data.getCurrentOffers(); await data.getUpcomingEvents();
    expect(prisma.offer.findMany.mock.calls[0][0].where.restaurant).toEqual(approved);
    expect(prisma.event.findMany.mock.calls[0][0].where.restaurant).toEqual(approved);
  });

  it("only shows approved, active, in-date offers and published, approved, future events", async () => {
    await data.getCurrentOffers(); await data.getUpcomingEvents();
    expect(prisma.offer.findMany.mock.calls[0][0].where).toMatchObject({ status: "APPROVED", isActive: true, deletedAt: null });
    expect(prisma.event.findMany.mock.calls[0][0].where).toMatchObject({ status: "APPROVED", isPublished: true, deletedAt: null });
  });

  it("counts only public restaurants in category tiles", async () => {
    await data.getFilterOptions();
    const cuisineCount = prisma.cuisine.findMany.mock.calls[0][0].select._count.select.restaurants.where;
    expect(cuisineCount).toEqual({ restaurant: approved });
    const areaCount = prisma.area.findMany.mock.calls[0][0].select._count.select.restaurants.where;
    expect(areaCount).toEqual(approved);
  });
});

describe("trending", () => {
  const row = (id) => ({
    id, slug: id, name: id, shortDescription: null, coverUrl: null, logoUrl: null, priceRange: "BUDGET",
    averageRating: 4, reviewCount: 5, isFeatured: false, isDemo: true, verificationStatus: "PENDING", operatingStatus: "OPEN",
    area: { name: "Kilimani", slug: "kilimani" }, cuisines: [{ isPrimary: true, cuisine: { name: "Kenyan", slug: "kenyan" } }],
    openingPeriods: [], specialHours: [], offers: [],
  });

  it("orders by activity and fills the rest with most-viewed listings", async () => {
    prisma.analyticsEvent.groupBy.mockResolvedValueOnce([{ restaurantId: "b" }, { restaurantId: "a" }]);
    prisma.restaurant.findMany
      .mockResolvedValueOnce([row("a"), row("b")]) // activity lookup (unordered)
      .mockResolvedValueOnce([row("c")]); // filler
    const result = await data.getTrending(3);
    expect(result.map((r) => r.id)).toEqual(["b", "a", "c"]);
    const filler = prisma.restaurant.findMany.mock.calls[1][0];
    expect(filler.where.id).toEqual({ notIn: ["b", "a"] });
    expect(filler.where).toMatchObject(approved);
  });
});

describe("toCard", () => {
  it("returns plain serialisable data with verification and offer flags", () => {
    const card = data.toCard({
      id: "1", slug: "x", name: "X", shortDescription: "d", coverUrl: "/c.svg", logoUrl: null, priceRange: "PREMIUM",
      averageRating: 4.5, reviewCount: 10, isFeatured: true, isDemo: true, verificationStatus: "VERIFIED", operatingStatus: "OPEN",
      area: { name: "Karen", slug: "karen" },
      cuisines: [{ isPrimary: true, cuisine: { name: "Steakhouse", slug: "steakhouse" } }],
      openingPeriods: [{ dayOfWeek: 2, opensAt: "12:00", closesAt: "22:00" }],
      specialHours: [{ date: new Date("2026-12-25T00:00:00Z"), isClosed: true, opensAt: null, closesAt: null }],
      offers: [{ title: "Lunch deal" }],
    });
    expect(card).toMatchObject({ verified: true, offerTitle: "Lunch deal", areaName: "Karen", cuisines: ["Steakhouse"] });
    expect(card.schedule).toEqual({
      operatingStatus: "OPEN", periods: [[2, "12:00", "22:00"]], special: [{ date: "2026-12-25", closed: true, opens: null, closes: null }],
    });
    expect(() => JSON.stringify(card)).not.toThrow();
  });
});
