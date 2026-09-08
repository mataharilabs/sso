import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { updateUserSchema, profileToPrisma } from "@/lib/validations/user";
import { syncAppRoles } from "@/lib/app-roles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: { id, companyId: admin.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        phone: true,
        reportsToId: true,
        profile: true,
        appRoles: { select: { applicationKey: true, role: true } },
      },
    });
    if (!user) return handleApiError({ name: "NotFound" });
    return ok(user);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { id, companyId: admin.companyId },
    });
    if (!existing) return handleApiError({ name: "NotFound" });

    if (id === admin.id && data.isActive === false) {
      return ok({ error: "Tidak bisa menonaktifkan akun sendiri" }, 400);
    }
    if (data.email && data.email !== existing.email) {
      if (await prisma.user.findUnique({ where: { email: data.email } })) {
        return ok({ error: "Email sudah dipakai user lain" }, 409);
      }
    }

    const profileData = profileToPrisma(data.profile);

    await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.isSuperAdmin !== undefined ? { isSuperAdmin: data.isSuperAdmin } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.reportsToId !== undefined ? { reportsToId: data.reportsToId || null } : {}),
        ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
        ...(data.profile
          ? { profile: { upsert: { create: profileData, update: profileData } } }
          : {}),
      },
    });

    await syncAppRoles(id, data.appRoles);

    return ok({ id });
  } catch (e) {
    return handleApiError(e);
  }
}
