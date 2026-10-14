import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/utils/api";
import { requireUser } from "./current-user";

// Restaurant-level roles, lowest to highest. Matches the StaffRole enum.
const RANK = { MANAGER: 1, OWNER: 2 };

// Use this in every owner API route that touches one restaurant.
// The restaurant id from the browser is never trusted on its own: the signed-in
// user must be staff of that restaurant (admins can access any restaurant).
//
//   const { user, isAdmin, staffRole } = await requireRestaurantAccess(id);
//   const { user } = await requireRestaurantAccess(id, "OWNER"); // owners only
export async function requireRestaurantAccess(restaurantId, minRole = "MANAGER") {
  const user = await requireUser();

  if (user.role === "ADMIN") return { user, isAdmin: true, staffRole: null };
  if (user.role !== "OWNER") throw new ApiError(403, "You don't have permission to do that.");

  const staff = await prisma.restaurantStaff.findUnique({
    where: { restaurantId_userId: { restaurantId, userId: user.id } },
    select: { role: true, restaurant: { select: { deletedAt: true } } },
  });

  // Same answer whether the restaurant exists or not, so ids can't be probed.
  if (!staff || staff.restaurant.deletedAt) throw new ApiError(404, "Restaurant not found.");
  if (RANK[staff.role] < RANK[minRole]) throw new ApiError(403, "You don't have permission to do that.");

  return { user, isAdmin: false, staffRole: staff.role };
}