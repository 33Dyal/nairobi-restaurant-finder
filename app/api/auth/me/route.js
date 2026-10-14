import { ok, handleError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/current-user";
import { toPublicUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    return ok({ user: toPublicUser(user) });
  } catch (error) {
    return handleError(error);
  }
}
