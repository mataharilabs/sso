import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";

const schema = z.object({ name: z.string().min(1, "Nama wajib diisi") });

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    const rows = await prisma.department.findMany({
      where: { companyId: admin.companyId },
      orderBy: { name: "asc" },
    });
    return ok(rows);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const data = schema.parse(await req.json());
    const created = await prisma.department.create({
      data: { name: data.name, companyId: admin.companyId },
    });
    return ok(created, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
