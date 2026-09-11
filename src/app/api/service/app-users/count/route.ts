import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkService, serviceUnauthorized } from "@/lib/service-auth";

// GET: jumlah user yang punya akses pada aplikasi (opsional per company).
// ?applicationKey=ASET&companyId=...
export async function GET(req: NextRequest) {
  if (!checkService(req)) return serviceUnauthorized();
  const sp = req.nextUrl.searchParams;
  const applicationKey = sp.get("applicationKey") ?? "ASET";
  const companyId = sp.get("companyId") || undefined;

  const count = await prisma.userAppRole.count({
    where: {
      applicationKey,
      // Admin platform SSO (isSuperAdmin) tidak dihitung sebagai pengguna aplikasi.
      user: { isActive: true, isSuperAdmin: false, ...(companyId ? { companyId } : {}) },
    },
  });
  return Response.json({ count });
}
