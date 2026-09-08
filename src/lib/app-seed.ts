import { prisma } from "@/lib/prisma";
import { APP_ROLE_OPTIONS } from "@/lib/constants";

const APP_NAMES: Record<string, string> = {
  ASET: "Manajemen Aset",
  HRIS: "HRIS",
};

/**
 * Pastikan baris Application ada (idempotent). Diperlukan karena build hanya
 * menjalankan `prisma db push` tanpa seed. Tanpa ini, assign UserAppRole gagal
 * (FK ke Application.key).
 */
export async function ensureApplications(): Promise<void> {
  for (const key of Object.keys(APP_ROLE_OPTIONS)) {
    await prisma.application.upsert({
      where: { key },
      update: {},
      create: { key, name: APP_NAMES[key] ?? key },
    });
  }
}
