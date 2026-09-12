import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/session";
import { handleApiError, ok } from "@/lib/api";
import { getNotificationSetting, updateNotificationSetting } from "@/lib/settings";
import { waConfigured } from "@/lib/wa-gateway";
import { emailConfigured } from "@/lib/email";

export async function GET() {
  try {
    await requireSuperAdmin();
    const s = await getNotificationSetting();
    return ok({
      whatsappEnabled: s.whatsappEnabled,
      emailEnabled: s.emailEnabled,
      emailFrom: process.env.EMAIL_FROM ?? s.emailFrom ?? null,
      whatsappConfigured: waConfigured(),
      emailConfigured: emailConfigured(),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

const schema = z.object({
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const data = schema.parse(await req.json());
    const s = await updateNotificationSetting(data);
    return ok({
      whatsappEnabled: s.whatsappEnabled,
      emailEnabled: s.emailEnabled,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
