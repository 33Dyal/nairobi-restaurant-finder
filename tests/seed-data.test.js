import { describe, it, expect } from "vitest";
import { buildSeedData } from "../prisma/seed-data.js";

const d = buildSeedData(new Date("2026-10-01T00:00:00Z"));
const slugs = (rows) => rows.map((r) => r.slug);
const unique = (arr) => new Set(arr).size === arr.length;

describe("seed data integrity", () => {
  it("has unique slugs everywhere", () => {
    for (const k of ["areas", "cuisines", "vibes", "amenities", "restaurants"]) expect(unique(slugs(d[k]))).toBe(true);
  });

  it("covers all 19 required Nairobi areas", () => {
    expect(d.areas).toHaveLength(19);
    const used = new Set(d.restaurants.map((r) => r.areaSlug));
    for (const a of d.areas) expect(used.has(a.slug)).toBe(true);
  });

  it("references only existing categories", () => {
    const c = new Set(slugs(d.cuisines)), v = new Set(slugs(d.vibes)), a = new Set(slugs(d.amenities)), ar = new Set(slugs(d.areas));
    for (const r of d.restaurants) {
      expect(ar.has(r.areaSlug)).toBe(true);
      r.cuisineSlugs.forEach((s) => expect(c.has(s)).toBe(true));
      r.vibeSlugs.forEach((s) => expect(v.has(s)).toBe(true));
      r.amenitySlugs.forEach((s) => expect(a.has(s)).toBe(true));
      expect(r.menu.categories.length).toBeGreaterThan(0);
    }
  });

  it("links offers, events, reviews and special hours to real restaurants", () => {
    const s = new Set(slugs(d.restaurants));
    for (const list of [d.offers, d.events, d.specialHours, d.analytics]) list.forEach((x) => expect(s.has(x.restaurantSlug)).toBe(true));
    d.reviews.forEach((x) => expect(s.has(x.restaurantSlug)).toBe(true));
  });

  it("never creates two reviews by one user for one restaurant", () => {
    expect(unique(d.reviews.map((r) => `${r.restaurantSlug}:${r.userKey}`))).toBe(true);
  });

  it("keeps non-approved restaurants free of reviews, offers and events", () => {
    const hidden = new Set(d.restaurants.filter((r) => r.approvalStatus !== "APPROVED").map((r) => r.slug));
    expect(hidden.size).toBeGreaterThan(0);
    for (const list of [d.reviews, d.offers, d.events]) list.forEach((x) => expect(hidden.has(x.restaurantSlug)).toBe(false));
  });

  it("marks every restaurant as sample data and uses only example.com accounts", () => {
    d.restaurants.forEach((r) => expect(r.isDemo).toBe(true));
    d.users.forEach((u) => expect(u.email.endsWith("@example.com")).toBe(true));
  });

  it("contains no transactional concepts in menu data", () => {
    const text = JSON.stringify(d.restaurants.map((r) => r.menu)).toLowerCase();
    for (const w of ["order now", "checkout", "add to cart", "book a table"]) expect(text).not.toContain(w);
  });

  it("is deterministic", () => {
    const again = buildSeedData(new Date("2026-10-01T00:00:00Z"));
    expect(again.restaurants.map((r) => [r.slug, r.latitude])).toEqual(d.restaurants.map((r) => [r.slug, r.latitude]));
  });
});
