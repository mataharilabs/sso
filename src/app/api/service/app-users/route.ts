import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkService, serviceUnauthorized } from "@/lib/service-auth";
import { ensureApplications } from "@/lib/app-seed";

// GET: daftar user yang punya akses (UserAppRole) pada aplikasi tertentu.
// ?applicationKey=ASET&role=ASSET_HANDLER&companyId=...
export async function GET(req: NextRequest) {
  if (!checkService(req)) return serviceUnauthorized();
  const sp = req.nextUrl.searchParams;
  const applicationKey = sp.get("applicationKey") ?? "ASET";
  const role = sp.get("role") || undefined;
  const companyId = sp.get("companyId") || undefined;

  const rows = await prisma.userAppRole.findMany({
    where: {
      applicationKey,
      ...(role ? { role } : {}),
      // Admin platform SSO (isSuperAdmin) dikecualikan dari daftar aplikasi.
      user: { isActive: true, isSuperAdmin: false, ...(companyId ? { companyId } : {}) },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const users = rows.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.role,
  }));
  return Response.json({ users });
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyId: z.string().min(1),
  applicationKey: z.string().default("ASET"),
  role: z.string().min(1),
});

// POST: buat/pastikan user + assign role aplikasi. Idempotent per email.
export async function POST(req: NextRequest) {
  if (!checkService(req)) return serviceUnauthorized();
  try {
    const data = createSchema.parse(await req.json());
    await ensureApplications();

    let user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
          companyId: data.companyId,
        },
      });
    }

    await prisma.userAppRole.upsert({
      where: {
        userId_applicationKey: {
          userId: user.id,
          applicationKey: data.applicationKey,
        },
      },
      update: { role: data.role },
      create: {
        userId: user.id,
        applicationKey: data.applicationKey,
        role: data.role,
      },
    });

    return Response.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Validasi gagal", issues: e.issues }, { status: 422 });
    }
    console.error("[SERVICE_APP_USERS_POST]", e);
    return Response.json({ error: "Gagal membuat user" }, { status: 500 });
  }
}
