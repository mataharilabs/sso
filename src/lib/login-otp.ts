import { prisma } from "@/lib/prisma";
import { sendEmail, emailConfigured } from "@/lib/email";
import { waSend, waConfigured } from "@/lib/wa-gateway";
import { normalizePhone } from "@/lib/phone";

const COOLDOWN_MS = 60 * 1000;
const TTL_MS = 5 * 60 * 1000;

export type OtpRequestResult = {
  ok: boolean;
  error?: string;
  channel?: "email" | "whatsapp";
  dest?: string; // tujuan tersamar (untuk info di UI)
};

type ResolvedUser = {
  email: string;
  phone: string | null;
  name: string | null;
  kind: "email" | "phone";
};

function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  if (!d) return e;
  return `${u.slice(0, 2)}${"•".repeat(Math.max(2, u.length - 2))}@${d}`;
}
function maskPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  return d.length <= 4 ? d : `${"•".repeat(d.length - 4)}${d.slice(-4)}`;
}

/** Cari user aktif dari email ATAU nomor (dinormalkan). */
async function resolveUser(identifier: string): Promise<ResolvedUser | null> {
  const id = identifier.trim();
  if (!id) return null;

  if (isEmail(id)) {
    const user = await prisma.user.findUnique({
      where: { email: id.toLowerCase() },
      select: { email: true, phone: true, name: true, isActive: true },
    });
    if (!user || !user.isActive) return null;
    return { email: user.email, phone: user.phone, name: user.name, kind: "email" };
  }

  const norm = normalizePhone(id);
  if (!norm) return null;
  // Cocokkan nomor secara ternormalisasi (format tersimpan bisa 08../+62../62..).
  const candidates = await prisma.user.findMany({
    where: { isActive: true, phone: { not: null } },
    select: { email: true, phone: true, name: true },
  });
  const match = candidates.find((u) => normalizePhone(u.phone) === norm);
  if (!match) return null;
  return { email: match.email, phone: match.phone, name: match.name, kind: "phone" };
}

/**
 * Buat kode OTP login & kirim ke channel sesuai identitas:
 * email → email; nomor → WhatsApp. Tidak lewat toggle notifikasi.
 */
export async function createAndSendLoginOtp(
  identifier: string
): Promise<OtpRequestResult> {
  const id = identifier.trim();
  if (!id) return { ok: false, error: "Masukkan nomor WhatsApp atau email" };

  const resolved = await resolveUser(id);
  if (!resolved) {
    return {
      ok: false,
      error: isEmail(id)
        ? "Email tidak terdaftar atau akun nonaktif"
        : "Nomor WhatsApp tidak terdaftar atau akun nonaktif",
    };
  }

  const last = await prisma.loginOtp.findFirst({
    where: { email: resolved.email, consumedAt: null },
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
    data: { email: resolved.email, code, expiresAt: new Date(Date.now() + TTL_MS) },
  });

  if (resolved.kind === "email") {
    if (!emailConfigured()) {
      await prisma.loginOtp.delete({ where: { id: otp.id } }).catch(() => {});
      return { ok: false, error: "Email belum dikonfigurasi. Coba login dengan sandi." };
    }
    try {
      await sendEmail({
        to: resolved.email,
        subject: "Kode Masuk AsiaCommerce ID",
        text:
          `Halo! Ini kode masuk kamu ke AsiaCommerce ID:\n\n` +
          `${code}\n\n` +
          `Kode ini aktif selama 5 menit. Jangan bagikan ke siapa pun, ya!`,
      });
      return { ok: true, channel: "email", dest: maskEmail(resolved.email) };
    } catch (e) {
      console.error("[LOGIN_OTP][email]", (e as Error).message);
      await prisma.loginOtp.delete({ where: { id: otp.id } }).catch(() => {});
      return { ok: false, error: "Gagal mengirim kode ke email. Coba lagi." };
    }
  }

  // kind === "phone"
  const phone = normalizePhone(resolved.phone);
  if (!waConfigured() || !phone) {
    await prisma.loginOtp.delete({ where: { id: otp.id } }).catch(() => {});
    return {
      ok: false,
      error: "WhatsApp belum tersambung. Coba login dengan email atau sandi.",
    };
  }
  try {
    await waSend(
      phone,
      `Halo! Ini kode masuk kamu ke AsiaCommerce ID:\n\n*${code}*\n\n` +
        `Kode ini aktif selama 5 menit. Jangan bagikan ke siapa pun, ya!`
    );
    return { ok: true, channel: "whatsapp", dest: maskPhone(phone) };
  } catch (e) {
    console.error("[LOGIN_OTP][wa]", (e as Error).message);
    await prisma.loginOtp.delete({ where: { id: otp.id } }).catch(() => {});
    return { ok: false, error: "Gagal mengirim kode ke WhatsApp. Coba lagi." };
  }
}

/** Verifikasi OTP dari email/nomor; kembalikan user lengkap atau null. */
export async function verifyLoginOtp(identifier: string, code: string) {
  const resolved = await resolveUser(identifier);
  if (!resolved) return null;

  const otp = await prisma.loginOtp.findFirst({
    where: { email: resolved.email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.code !== code.trim()) return null;

  await prisma.loginOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return prisma.user.findUnique({
    where: { email: resolved.email },
    include: { company: true, appRoles: true },
  });
}
