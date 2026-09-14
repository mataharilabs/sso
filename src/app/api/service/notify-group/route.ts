import { NextRequest } from "next/server";
import { z } from "zod";
import { checkService, serviceUnauthorized } from "@/lib/service-auth";
import { getNotificationSetting } from "@/lib/settings";
import { waSend, waConfigured } from "@/lib/wa-gateway";

// Kirim pesan ke grup WhatsApp kantor (dipanggil aplikasi lain, mis. HRIS).
const schema = z.object({ message: z.string().min(1) });

export async function POST(req: NextRequest) {
  if (!checkService(req)) return serviceUnauthorized();
  try {
    const { message } = schema.parse(await req.json());
    const setting = await getNotificationSetting();

    if (!setting.whatsappEnabled || !waConfigured() || !setting.whatsappGroupJid) {
      return Response.json({ ok: false, skipped: true });
    }
    try {
      await waSend(setting.whatsappGroupJid, message);
      return Response.json({ ok: true });
    } catch (e) {
      console.error("[NOTIFY_GROUP]", (e as Error).message);
      return Response.json({ ok: false, error: (e as Error).message }, { status: 502 });
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Validasi gagal" }, { status: 422 });
    }
    return Response.json({ error: "Gagal" }, { status: 500 });
  }
}
