import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { waStatus } from "@/lib/wa-gateway";
import { updateNotificationSetting } from "@/lib/settings";

export async function GET() {
  try {
    await requireSuperAdmin();
    const s = await waStatus();
    // Cache nomor tersambung untuk ditampilkan cepat.
    if (s.connected && s.phone) {
      await updateNotificationSetting({ whatsappPhone: s.phone });
    }
    return ok(s);
  } catch (e) {
    return handleApiError(e);
  }
}
