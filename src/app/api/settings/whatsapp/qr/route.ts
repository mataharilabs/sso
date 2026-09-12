import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { waQr } from "@/lib/wa-gateway";

export async function GET() {
  try {
    await requireSuperAdmin();
    return ok(await waQr());
  } catch (e) {
    return handleApiError(e);
  }
}
