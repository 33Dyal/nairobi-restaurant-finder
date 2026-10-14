import { prisma } from "@/lib/db/prisma";

// Audit logging must never break the action being logged.
export async function writeAudit({ actorId = null, action, entityType, entityId = null, metadata, ipAddress = null }) {
  try {
    await prisma.auditLog.create({ data: { actorId, action, entityType, entityId, metadata, ipAddress } });
  } catch (error) {
    console.error("[AUDIT]", error);
  }
}
