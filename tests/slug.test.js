import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "@/lib/utils/slug";

describe("slugify", () => {
  it("handles apostrophes, ampersands and accents", () => {
    expect(slugify("Lang'ata")).toBe("langata");
    expect(slugify("Wine & Tapas")).toBe("wine-and-tapas");
    expect(slugify("Café Déjà")).toBe("cafe-deja");
  });
});

describe("uniqueSlug", () => {
  it("appends a counter when the slug is taken", async () => {
    const taken = new Set(["acacia", "acacia-2"]);
    expect(await uniqueSlug("Acacia", async (s) => taken.has(s))).toBe("acacia-3");
  });
});
