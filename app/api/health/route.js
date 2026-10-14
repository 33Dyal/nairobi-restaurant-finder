import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "healthy", database: "connected" });
  } catch (error) {
    console.error("[HEALTH]", error);
    return fail("Database connection failed", 503);
  }
}
