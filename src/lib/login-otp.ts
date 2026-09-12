import { prisma } from "@/lib/prisma";
import { sendEmail, emailConfigured } from "@/lib/email";
import { waSend, waConfigured } from "@/lib/wa-gateway";
import { normalizePhone } from "@/lib/phone";

const COOLDOWN_MS = 60 * 1000;
const TTL_MS = 5 * 60 * 1000;

export type OtpRequestResult = {
  ok: boolean;
  error?: string;
  channels?: { email: boolean; whatsapp: boolean };
};

/** Buat kode OTP login & kirim ke email + WhatsApp user. Tidak lewat toggle notifikasi. */
export async function createAndSendLoginOtp(
  rawEmail: string
): Promise<OtpRequestResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email wajib diisi" };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, phone: true, name: true, isActive: true },
  });
  if (!user || !user.isActive) {
    return { ok: false, error: "Email tidak terdaftar atau akun nonaktif" };
  }

  const last = await prisma.loginOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < COOLDOWN_MS) {
    const wait = Math.ceil(
      (COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000
    );
    return { ok: false, error: `Tunggu ${wait} detik untuk mengirim ulang kode` };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otp = await prisma.loginOtp.create({
    data: { email, code, expiresAt: new Date(Date.now() + TTL_MS) },
  });

  let sentEmail = false;
  let sentWa = false;

  if (emailConfigured()) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Kode Masuk AsiaCommerce ID",
        text: `Kode masuk Anda: ${code}\nBerlaku 5 menit. Jangan bagikan kode ini ke siapa pun.`,
      });
      sentEmail = true;
    } catch (e) {
      console.error("[LOGIN_OTP][email]", (e as Error).message);
    }
  }

  const phone = normalizePhone(user.phone);
  if (waConfigured() && phone) {
    try {
      await waSend(phone, `Kode masuk AsiaCommerce ID: *${code}* (berlaku 5 menit).`);
      sentWa = true;
    } catch (e) {
      console.error("[LOGIN_OTP][wa]", (e as Error).message);
    }
  }

  if (!sentEmail && !sentWa) {
    await prisma.loginOtp.delete({ where: { id: otp.id } }).catch(() => {});
    return {
      ok: false,
      error: "Gagal mengirim kode. Coba login dengan sandi atau hubungi admin.",
    };
  }

  return { ok: true, channels: { email: sentEmail, whatsapp: sentWa } };
}

/** Verifikasi OTP; kembalikan user lengkap (dengan appRoles & company) atau null. */
export async function verifyLoginOtp(rawEmail: string, code: string) {
  const email = rawEmail.trim().toLowerCase();
  const otp = await prisma.loginOtp.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.code !== code.trim()) return null;

  await prisma.loginOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return prisma.user.findUnique({
    where: { email },
    include: { company: true, appRoles: true },
  });
}
