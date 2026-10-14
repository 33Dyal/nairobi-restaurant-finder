import { z } from "zod";

const ids = (max, message) => z.array(z.string().min(1)).max(max, message);

export const restaurantCategoriesSchema = z.object({
  cuisineIds: z
    .array(z.string().min(1))
    .min(1, "Choose at least one cuisine.")
    .max(6, "Choose up to 6 cuisines."),
  primaryCuisineId: z.string().nullish(),
  vibeIds: ids(8, "Choose up to 8 vibes."),
  amenityIds: ids(40, "Choose up to 40 amenities."),
});