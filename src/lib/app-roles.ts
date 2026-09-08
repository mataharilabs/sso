import { prisma } from "@/lib/prisma";

/**
 * Sinkronkan role per-aplikasi user.
 * appRoles: { ASET: "ASSET_MANAGER", HRIS: "" } — "" / kosong = cabut akses.
 */
export async function syncAppRoles(
  userId: string,
  appRoles: Record<string, string> | undefined
): Promise<void> {
  if (!appRoles) return;
  for (const [applicationKey, role] of Object.entries(appRoles)) {
    if (role && role.trim()) {
      await prisma.userAppRole.upsert({
        where: { userId_applicationKey: { userId, applicationKey } },
        update: { role },
        create: { userId, applicationKey, role },
      });
    } else {
      await prisma.userAppRole
        .delete({
          where: { userId_applicationKey: { userId, applicationKey } },
        })
        .catch(() => {});
    }
  }
}
