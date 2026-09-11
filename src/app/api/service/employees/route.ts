import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkService, serviceUnauthorized } from "@/lib/service-auth";

// GET: daftar SEMUA karyawan (user aktif) satu company beserta profilnya,
// untuk dicermin oleh HRIS. ?companyId=...
export async function GET(req: NextRequest) {
  if (!checkService(req)) return serviceUnauthorized();
  const companyId = req.nextUrl.searchParams.get("companyId") || undefined;

  const users = await prisma.user.findMany({
    // Admin platform SSO (isSuperAdmin) bukan karyawan → dikecualikan.
    where: { isActive: true, isSuperAdmin: false, ...(companyId ? { companyId } : {}) },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profile: {
        select: {
          nickname: true,
          birthDate: true,
          gender: true,
          maritalStatus: true,
          nik: true,
          npwp: true,
          addressDomicile: true,
          personalEmail: true,
          emergencyName: true,
          emergencyRelation: true,
          emergencyPhone: true,
          employeeId: true,
          jobTitle: true,
          level: true,
          employmentStatus: true,
          joinDate: true,
          endDate: true,
          dept: { select: { name: true } },
          office: { select: { name: true } },
        },
      },
    },
  });

  const employees = users.map((u) => {
    const p = u.profile;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      nickname: p?.nickname ?? null,
      birthDate: p?.birthDate ?? null,
      gender: p?.gender ?? null,
      maritalStatus: p?.maritalStatus ?? null,
      nik: p?.nik ?? null,
      npwp: p?.npwp ?? null,
      addressDomicile: p?.addressDomicile ?? null,
      personalEmail: p?.personalEmail ?? null,
      emergencyName: p?.emergencyName ?? null,
      emergencyRelation: p?.emergencyRelation ?? null,
      emergencyPhone: p?.emergencyPhone ?? null,
      employeeCode: p?.employeeId ?? null,
      jobTitle: p?.jobTitle ?? null,
      level: p?.level ?? null,
      employmentStatus: p?.employmentStatus ?? null,
      joinDate: p?.joinDate ?? null,
      endDate: p?.endDate ?? null,
      departmentName: p?.dept?.name ?? null,
      officeName: p?.office?.name ?? null,
    };
  });

  return Response.json({ employees });
}
