import { NextRequest } from "next/server";
import { z } from "zod";
import { checkService, serviceUnauthorized } from "@/lib/service-auth";
import { sendNotification } from "@/lib/notify";

// Dipanggil aplikasi lain (ASET/HRIS) untuk mengirim notifikasi terpusat.
const schema = z.object({
  to: z.object({
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
  }),
  subject: z.string().optional(),
  message: z.string().min(1),
  channels: z.array(z.enum(["email", "whatsapp"])).optional(),
});

export async function POST(req: NextRequest) {
  if (!checkService(req)) return serviceUnauthorized();
  try {
    const data = schema.parse(await req.json());
    const result = await sendNotification(data);
    // Log kegagalan channel agar terlihat di log (mis. Vercel).
    if (result.whatsapp && !result.whatsapp.sent) {
      console.error("[NOTIFY][wa] gagal:", result.whatsapp.error, "phone=", data.to.phone);
    }
    if (result.email && !result.email.sent) {
      console.error("[NOTIFY][email] gagal:", result.email.error, "email=", data.to.email);
    }
    return Response.json({ ok: true, result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Validasi gagal", issues: e.issues }, { status: 422 });
    }
    console.error("[SERVICE_NOTIFY]", e);
    return Response.json({ error: "Gagal mengirim notifikasi" }, { status: 500 });
  }
}
