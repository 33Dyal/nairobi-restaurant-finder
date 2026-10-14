import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }), usePathname: () => "/", useSearchParams: () => new URLSearchParams() }));

const card = (over = {}) => ({
  id: "1", slug: "acacia-grill-house", name: "Acacia Grill House", shortDescription: "Charcoal-grilled meats in Westlands.",
  coverUrl: "/demo/bbq.svg", logoUrl: null, priceRange: "MID_RANGE", rating: { average: 4.4, count: 12 },
  isFeatured: true, isDemo: true, verified: true, areaName: "Westlands", areaSlug: "westlands",
  cuisines: ["BBQ", "Kenyan"], offerTitle: "Weekday Lunch Special",
  schedule: { operatingStatus: "OPEN", periods: [[1, "11:00", "22:00"]], special: [] }, ...over,
});

const fixture = {
  featured: [card()],
  trending: [card({ id: "2", slug: "new-place", name: "New Place", rating: { average: 0, count: 0 }, isFeatured: false, verified: false, offerTitle: null, coverUrl: null })],
  newest: [], topRated: [],
  filters: {
    cuisines: [{ name: "Italian", slug: "italian", count: 3 }, { name: "Empty Cuisine", slug: "empty", count: 0 }],
    areas: [{ name: "Westlands", slug: "westlands", count: 4 }],
    vibes: [{ name: "Rooftop", slug: "rooftop", count: 2 }],
  },
  offers: [{ id: "o1", title: "Pasta Tuesday", description: "Any pasta at a fixed price.", endsAt: new Date("2026-11-20T00:00:00Z"), restaurantName: "Trattoria Kilima", restaurantSlug: "trattoria-kilima", areaName: "Kilimani" }],
  events: [{ id: "e1", title: "Rooftop Jazz Evening", category: "LIVE_MUSIC", startsAt: new Date("2026-10-10T16:00:00Z"), restaurantName: "Jacaranda Rooftop Kitchen", restaurantSlug: "jacaranda", areaName: "Kilimani" }],
  popularSearches: [],
};
const data = { current: fixture };
vi.mock("@/lib/data/public", () => ({ getHomepageData: async () => data.current }));

const render = async () => {
  const { default: HomePage } = await import("@/app/(public)/page.js");
  return renderToStaticMarkup(await HomePage());
};

describe("homepage", () => {
  it("renders the hero, search and quick filters from database options", async () => {
    const html = await render();
    expect(html).toContain("Discover the Best Restaurants in Nairobi");
    expect(html).toContain("Find restaurants by cuisine, location, budget, atmosphere, ratings and more.");
    expect(html).toContain('role="search"');
    for (const label of ["Cuisine", "Area", "Vibe", "Budget", "Rating", "Open now"]) expect(html).toContain(label);
    expect(html).toContain('value="italian"');
    expect(html).not.toContain("Empty Cuisine"); // no restaurants, so not offered
  });

  it("renders restaurant cards with the required details", async () => {
    const html = await render();
    expect(html).toContain("Acacia Grill House");
    expect(html).toContain('href="/restaurants/acacia-grill-house"');
    expect(html).toContain("Featured");
    expect(html).toContain("(verified)");
    expect(html).toContain("Offer");
    expect(html).toContain("Sample listing");
    expect(html).toContain("4.4");
    expect(html).toContain("12 reviews");
    expect(html).toContain("Mid-range");
    expect(html).toContain("Westlands");
    expect(html).toMatch(/Open ·|Closed ·/);
  });

  it("shows 'New' instead of 0.0 for unreviewed restaurants and a placeholder without a cover", async () => {
    const html = await render();
    expect(html).toContain(">New<");
    expect(html).not.toMatch(/>0\.0</);
  });

  it("shows browse tiles, offers, events and falls back to example searches", async () => {
    const html = await render();
    expect(html).toContain('href="/explore?cuisine=italian"');
    expect(html).not.toContain("Empty Cuisine");
    expect(html).toContain("Pasta Tuesday");
    expect(html).toContain("Rooftop Jazz Evening");
    expect(html).toContain("Popular searches");
    expect(html).toContain("Romantic restaurants");
  });

  it("hides empty rails but shows a helpful empty state when nothing is listed", async () => {
    data.current = { ...fixture, featured: [], trending: [], offers: [], events: [] };
    const html = await render();
    expect(html).not.toContain("Featured restaurants");
    expect(html).toContain("No restaurants to show yet");
    data.current = fixture;
  });

  it("never introduces reservation, ordering or payment actions", async () => {
    const html = (await render()).toLowerCase();
    for (const word of ["book a table", "reserve", "order now", "add to cart", "checkout", "buy ticket"]) expect(html).not.toContain(word);
  });
});
