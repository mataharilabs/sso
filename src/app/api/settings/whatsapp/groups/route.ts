import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { waGroups } from "@/lib/wa-gateway";

export async function GET() {
  try {
    await requireSuperAdmin();
    return ok({ groups: await waGroups() });
  } catch (e) {
    return handleApiError(e);
  }
}
