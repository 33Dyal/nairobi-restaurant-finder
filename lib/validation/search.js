import { z } from "zod";

export const SORTS = ["trending", "rating", "newest", "name"];
export const PRICES = ["BUDGET", "MODERATE", "MID_RANGE", "PREMIUM", "LUXURY"];
export const PAGE_SIZE = 12;

const csv = z.string().max(300).catch("").transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10));

// Every field has .catch(), so bad URLs fall back to defaults instead of throwing.
export const searchParamsSchema = z.object({
  q: z.string().trim().max(80).catch(""),
  cuisine: csv,
  area: csv,
  vibe: csv,
  price: csv,
  featured: z.string().catch("").transform((v) => v === "1"),
  rating: z.coerce.number().min(0).max(5).catch(0),
  sort: z.enum(SORTS).catch("trending"),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

export const suggestSchema = z.object({ q: z.string().trim().min(2).max(80) });