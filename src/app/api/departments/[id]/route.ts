import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";

const schema = z.object({ name: z.string().min(1, "Nama wajib diisi") });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const data = schema.parse(await req.json());
    const existing = await prisma.department.findFirst({
      where: { id, companyId: admin.companyId },
    });
    if (!existing) return handleApiError({ name: "NotFound" });
    const updated = await prisma.department.update({
      where: { id },
      data: { name: data.name },
    });
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const existing = await prisma.department.findFirst({
      where: { id, companyId: admin.companyId },
    });
    if (!existing) return handleApiError({ name: "NotFound" });
    await prisma.department.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
