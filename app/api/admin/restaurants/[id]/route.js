import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { ok, fail, handleError, parseBody } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireRole } from "@/lib/auth/current-user";
import { getClientIp } from "@/lib/auth/rate-limit";
import { writeAudit } from "@/lib/audit";

const schema = z
  .object({
    approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"]).optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.");

const SELECT = { id: true, slug: true, name: true, approvalStatus: true, verificationStatus: true, isFeatured: true };

export async function PATCH(request, { params }) {
  try {
    assertSameOrigin(request);
    const admin = await requireRole("ADMIN");
    const { id } = await params;
    const patch = await parseBody(request, schema);

    const existing = await prisma.restaurant.findFirst({ where: { id, deletedAt: null }, select: SELECT });
    if (!existing) return fail("Restaurant not found.", 404);

    const finalApproval = patch.approvalStatus ?? existing.approvalStatus;
    if (patch.isFeatured === true && finalApproval !== "APPROVED") {
      return fail("Only approved restaurants can be featured.", 400);
    }

    const data = { ...patch };
    if (patch.verificationStatus) {
      data.verifiedAt = patch.verificationStatus === "VERIFIED" ? new Date() : null;
    }
    // A restaurant that is no longer approved can't stay featured.
    if (finalApproval !== "APPROVED") data.isFeatured = false;

    const updated = await prisma.restaurant.update({ where: { id }, data, select: SELECT });

    await writeAudit({
      actorId: admin?.id ?? admin?.sub ?? null,
      action: "restaurant.update",
      entityType: "Restaurant",
      entityId: id,
      metadata: {
        name: updated.name,
        before: {
          approvalStatus: existing.approvalStatus,
          verificationStatus: existing.verificationStatus,
          isFeatured: existing.isFeatured,
        },
        after: {
          approvalStatus: updated.approvalStatus,
          verificationStatus: updated.verificationStatus,
          isFeatured: updated.isFeatured,
        },
      },
      ipAddress: getClientIp(request),
    });

    // The public pages are cached, so refresh the ones this change affects.
    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath(`/restaurants/${updated.slug}`);

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
