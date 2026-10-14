import { z } from "zod";
import { PRICES } from "@/lib/validation/search";

export const OPERATING_STATUSES = ["OPEN", "TEMPORARILY_CLOSED", "PERMANENTLY_CLOSED"];

// Service area (Kenya). Catches swapped or mistyped coordinates.
export const COORD_BOUNDS = { lat: [-5, 6], lng: [33, 43] };

const toNumber = (v) => (typeof v === "string" ? (v.trim() === "" ? NaN : Number(v)) : v);

const coordinate = (min, max, message) =>
  z
    .any()
    .transform(toNumber)
    .refine((n) => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max, message);

// Empty fields become null, so clearing a field in the form clears it in the database.
const nullableText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .nullish()
    .transform((v) => v || null);

const emailOrNull = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(120)
  .or(z.literal(""))
  .nullish()
  .transform((v) => v || null);

const urlOrNull = z
  .string()
  .trim()
  .url("Enter the full link, starting with https://")
  .max(200)
  .or(z.literal(""))
  .nullish()
  .transform((v) => v || null);

// Only fields an owner or manager may change. Admin-only fields (approvalStatus,
// verificationStatus, isFeatured, isDemo, ratings, counters, slug) are deliberately
// not here, so they are ignored even if someone sends them.
export const restaurantDetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter the restaurant's name.").max(120, "Keep the name under 120 characters."),
  shortDescription: nullableText(160),
  description: nullableText(2000),
  areaId: z.string().min(1, "Choose an area."),
  address: z.string().trim().min(3, "Enter the street address.").max(200, "Keep the address under 200 characters."),
  landmark: nullableText(120),
  latitude: coordinate(
    COORD_BOUNDS.lat[0],
    COORD_BOUNDS.lat[1],
    "Latitude should be between -5 and 6 for Kenya. Nairobi is about -1.29.",
  ),
  longitude: coordinate(
    COORD_BOUNDS.lng[0],
    COORD_BOUNDS.lng[1],
    "Longitude should be between 33 and 43 for Kenya. Nairobi is about 36.82.",
  ),
  priceRange: z.string().refine((v) => PRICES.includes(v), "Choose a price range."),
  operatingStatus: z.string().refine((v) => OPERATING_STATUSES.includes(v), "Choose a status."),
  phone: nullableText(30),
  email: emailOrNull,
  website: urlOrNull,
  instagramUrl: urlOrNull,
  facebookUrl: urlOrNull,
  twitterUrl: urlOrNull,
  tiktokUrl: urlOrNull,
  parkingInfo: nullableText(300),
  accessibilityInfo: nullableText(300),
});