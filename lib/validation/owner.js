import { z } from "zod";
import { PRICES } from "@/lib/validation/search";

// Empty form fields arrive as "", so optional text becomes undefined.
const optionalText = (max) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`).optional().transform((v) => v || undefined);

// Only fields an owner may set. Admin-only fields (approvalStatus, verificationStatus,
// isFeatured, isDemo, ratings, counters) are deliberately not here.
export const restaurantCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter the restaurant's name.").max(120, "Keep the name under 120 characters."),
  areaId: z.string().min(1, "Choose an area."),
  priceRange: z.string().refine((v) => PRICES.includes(v), "Choose a price range."),
  address: z.string().trim().min(3, "Enter the street address.").max(200, "Keep the address under 200 characters."),
  landmark: optionalText(120),
  phone: optionalText(30),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(120)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || undefined),
  website: z
    .string()
    .trim()
    .url("Enter the full link, starting with https://")
    .max(200)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || undefined),
  shortDescription: optionalText(160),
  description: optionalText(2000),
});