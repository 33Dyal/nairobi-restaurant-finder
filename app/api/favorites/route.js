import { ok, handleError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/current-user";
import { getFavoriteIds } from "@/lib/favorites";

export async function GET() {
  try {
    const user = await requireUser();
    return ok({ ids: await getFavoriteIds(user.id) });
  } catch (error) {
    return handleError(error);
  }
}