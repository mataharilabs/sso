import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkService, serviceUnauthorized } from "@/lib/service-auth";

// DELETE: cabut akses (UserAppRole) user pada aplikasi tertentu.
// ?applicationKey=ASET
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkService(req)) return serviceUnauthorized();
  const { id } = await params;
  const applicationKey = req.nextUrl.searchParams.get("applicationKey") ?? "ASET";

  await prisma.userAppRole
    .delete({
      where: { userId_applicationKey: { userId: id, applicationKey } },
    })
    .catch(() => {});

  return Response.json({ success: true });
}
