import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { ensureApplications } from "@/lib/app-seed";

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    await ensureApplications(); // pastikan ASET/HRIS ada sebelum assign role
    const [users, applications, departments, offices] = await Promise.all([
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
      prisma.department.findMany({
        where: { companyId: admin.companyId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.office.findMany({
        where: { companyId: admin.companyId },
        select: { id: true, name: true, city: true },
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
      }),
    ]);
    return ok({ users, applications, departments, offices });
  } catch (e) {
    return handleApiError(e);
  }
}
