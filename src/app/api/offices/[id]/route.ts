import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";

const bool = z.preprocess((v) => v === true || v === "true", z.boolean());
const opt = () =>
  z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable().optional());

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  country: opt(),
  province: opt(),
  city: opt(),
  address: opt(),
  isPrimary: bool.optional().default(false),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const data = schema.parse(await req.json());
    const existing = await prisma.office.findFirst({
      where: { id, companyId: admin.companyId },
    });
    if (!existing) return handleApiError({ name: "NotFound" });
    const updated = await prisma.office.update({
      where: { id },
      data: {
        name: data.name,
        country: data.country ?? null,
        province: data.province ?? null,
        city: data.city ?? null,
        address: data.address ?? null,
        isPrimary: data.isPrimary,
      },
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
    const existing = await prisma.office.findFirst({
      where: { id, companyId: admin.companyId },
    });
    if (!existing) return handleApiError({ name: "NotFound" });
    await prisma.office.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
