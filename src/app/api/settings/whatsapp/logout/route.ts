import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { waLogout } from "@/lib/wa-gateway";
import { updateNotificationSetting } from "@/lib/settings";

export async function POST() {
  try {
    await requireSuperAdmin();
    const done = await waLogout();
    if (done) await updateNotificationSetting({ whatsappPhone: null });
    return ok({ ok: done });
  } catch (e) {
    return handleApiError(e);
  }
}
