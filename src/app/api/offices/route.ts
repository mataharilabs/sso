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

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    const rows = await prisma.office.findMany({
      where: { companyId: admin.companyId },
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
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
    const created = await prisma.office.create({
      data: {
        name: data.name,
        country: data.country ?? null,
        province: data.province ?? null,
        city: data.city ?? null,
        address: data.address ?? null,
        isPrimary: data.isPrimary,
        companyId: admin.companyId,
      },
    });
    return ok(created, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
