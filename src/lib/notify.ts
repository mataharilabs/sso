import { getNotificationSetting } from "@/lib/settings";
import { sendEmail, emailConfigured } from "@/lib/email";
import { waSend, waConfigured } from "@/lib/wa-gateway";
import { normalizePhone } from "@/lib/phone";

export type NotifyChannel = "email" | "whatsapp";

export type NotifyInput = {
  to: { email?: string | null; phone?: string | null };
  subject?: string;
  message: string;
  /** Batasi channel; default: semua yang aktif & tersedia kontaknya. */
  channels?: NotifyChannel[];
};

export type NotifyResult = {
  email?: { sent: boolean; error?: string };
  whatsapp?: { sent: boolean; error?: string };
};

/**
 * Kirim notifikasi lewat channel yang AKTIF (setelan) & punya kontak.
 * Tidak melempar error — mengembalikan hasil per-channel agar pemanggil
 * bisa memutuskan (notifikasi bersifat best-effort).
 */
export async function sendNotification(input: NotifyInput): Promise<NotifyResult> {
  const setting = await getNotificationSetting();
  const want = (c: NotifyChannel) => !input.channels || input.channels.includes(c);
  const result: NotifyResult = {};

  // Email
  if (want("email") && setting.emailEnabled && input.to.email) {
    if (!emailConfigured()) {
      result.email = { sent: false, error: "Email belum dikonfigurasi" };
    } else {
      try {
        await sendEmail({
          to: input.to.email,
          subject: input.subject ?? "Notifikasi AsiaCommerce",
          text: input.message,
        });
        result.email = { sent: true };
      } catch (e) {
        result.email = { sent: false, error: (e as Error).message };
      }
    }
  }

  // WhatsApp
  const phone = normalizePhone(input.to.phone);
  if (want("whatsapp") && setting.whatsappEnabled && phone) {
    if (!waConfigured()) {
      result.whatsapp = { sent: false, error: "Gateway WA belum dikonfigurasi" };
    } else {
      try {
        await waSend(phone, input.message);
        result.whatsapp = { sent: true };
      } catch (e) {
        result.whatsapp = { sent: false, error: (e as Error).message };
      }
    }
  }

  return result;
}
