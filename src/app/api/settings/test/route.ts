import { requireSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { sendNotification } from "@/lib/notify";

// Kirim notifikasi uji ke admin yang sedang login (email & WA sesuai setelan).
export async function POST() {
  try {
    const admin = await requireSuperAdmin();
    const user = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { email: true, phone: true },
    });

    const result = await sendNotification({
      to: { email: user?.email, phone: user?.phone },
      subject: "Uji Notifikasi AsiaCommerce",
      message:
        "Ini pesan uji dari SSO AsiaCommerce. Jika Anda menerima ini, notifikasi berfungsi. ✅",
    });

    return ok({
      result,
      target: { email: user?.email ?? null, phone: user?.phone ?? null },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
