import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.EMAIL_FROM ?? "AsiaCommerce <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return Boolean(API_KEY);
}

const resend = API_KEY ? new Resend(API_KEY) : null;

/** Kirim email via Resend. Throw bila gagal / belum dikonfigurasi. */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (!resend) throw new Error("Email (Resend) belum dikonfigurasi");
  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<p>${escapeHtml(input.text).replace(/\n/g, "<br/>")}</p>`,
  });
  if (error) throw new Error(error.message || "Gagal mengirim email");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
