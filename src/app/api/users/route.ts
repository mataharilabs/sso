import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { createUserSchema, profileToPrisma } from "@/lib/validations/user";
import { syncAppRoles } from "@/lib/app-roles";

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    const users = await prisma.user.findMany({
      where: { companyId: admin.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        profile: { select: { jobTitle: true, department: true, employeeId: true } },
        appRoles: { select: { applicationKey: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return ok(users);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const data = createUserSchema.parse(body);

    if (await prisma.user.findUnique({ where: { email: data.email } })) {
      return ok({ error: "Email sudah terdaftar" }, 409);
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        isSuperAdmin: data.isSuperAdmin ?? false,
        phone: data.phone ?? null,
        reportsToId: data.reportsToId || null,
        companyId: admin.companyId,
        ...(data.profile ? { profile: { create: profileToPrisma(data.profile) } } : {}),
      },
      select: { id: true },
    });

    await syncAppRoles(created.id, data.appRoles);

    return ok({ id: created.id }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
