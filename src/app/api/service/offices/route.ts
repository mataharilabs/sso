import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkService, serviceUnauthorized } from "@/lib/service-auth";

// GET: daftar kantor (Office) milik sebuah company, untuk dijadikan
// master "Lokasi" di aplikasi lain (mis. ASET). ?companyId=...
export async function GET(req: NextRequest) {
  if (!checkService(req)) return serviceUnauthorized();
  const companyId = req.nextUrl.searchParams.get("companyId") || undefined;

  const rows = await prisma.office.findMany({
    where: { ...(companyId ? { companyId } : {}) },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      country: true,
      province: true,
      city: true,
      address: true,
      isPrimary: true,
    },
  });

  return Response.json({ offices: rows });
}
