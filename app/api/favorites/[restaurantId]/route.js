import { ok, handleError, ApiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit } from "@/lib/auth/rate-limit";
import { addFavorite, removeFavorite } from "@/lib/favorites";

async function authorize(request, params) {
  assertSameOrigin(request);
  const user = await requireUser();
  enforceRateLimit(`favorite:${user.id}`, 60, 60 * 1000);
  const { restaurantId } = await params;
  if (!restaurantId || restaurantId.length > 40) throw new ApiError(400, "Invalid restaurant.");
  return { user, restaurantId };
}

export async function PUT(request, { params }) {
  try {
    const { user, restaurantId } = await authorize(request, params);
    if (!(await addFavorite(user.id, restaurantId))) throw new ApiError(404, "Restaurant not found.");
    return ok({ saved: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, restaurantId } = await authorize(request, params);
    await removeFavorite(user.id, restaurantId);
    return ok({ saved: false });
  } catch (error) {
    return handleError(error);
  }
}