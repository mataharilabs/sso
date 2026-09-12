import { requireSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { sendNotification } from "@/lib/notify";
import { getNotificationSetting } from "@/lib/settings";
import { waStatus, waConfigured } from "@/lib/wa-gateway";
import { emailConfigured } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";

// Kirim notifikasi uji ke admin yang login + diagnosa kenapa channel gagal/di-skip.
export async function POST() {
  try {
    const admin = await requireSuperAdmin();
    const user = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { email: true, phone: true },
    });

    const setting = await getNotificationSetting();
    const status = await waStatus();
    const normalized = normalizePhone(user?.phone);

    const result = await sendNotification({
      to: { email: user?.email, phone: user?.phone },
      subject: "Uji Notifikasi AsiaCommerce",
      message:
        "Ini pesan uji dari SSO AsiaCommerce. Jika Anda menerima ini, notifikasi berfungsi. ✅",
    });

    // Diagnosa per channel (alasan bila tidak terkirim).
    const email = {
      sent: Boolean(result.email?.sent),
      reason: !setting.emailEnabled
        ? "Toggle Email nonaktif"
        : !emailConfigured()
          ? "RESEND_API_KEY belum diset"
          : !user?.email
            ? "Akun Anda tak punya email"
            : result.email?.error ?? (result.email?.sent ? "OK" : "Tidak dikirim"),
    };
    const whatsapp = {
      sent: Boolean(result.whatsapp?.sent),
      reason: !setting.whatsappEnabled
        ? "Toggle WhatsApp nonaktif"
        : !waConfigured()
          ? "WA_GATEWAY_URL/KEY belum diset"
          : !status.connected
            ? "Nomor WhatsApp belum tersambung (scan QR)"
            : !normalized
              ? `Nomor tidak valid/kosong (No. HP akun: ${user?.phone ?? "kosong"})`
              : result.whatsapp?.error ?? (result.whatsapp?.sent ? "OK" : "Tidak dikirim"),
    };

    return ok({
      email,
      whatsapp,
      target: { email: user?.email ?? null, phone: user?.phone ?? null },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
