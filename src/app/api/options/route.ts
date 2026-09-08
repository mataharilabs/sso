import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    const [users, applications] = await Promise.all([
      prisma.user.findMany({
        where: { companyId: admin.companyId, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.application.findMany({
        where: { isActive: true },
        select: { key: true, name: true },
        orderBy: { key: "asc" },
      }),
    ]);
    return ok({ users, applications });
  } catch (e) {
    return handleApiError(e);
  }
}
