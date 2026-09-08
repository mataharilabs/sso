// Validasi callbackUrl agar hanya redirect ke host yang diizinkan
// (mencegah open-redirect). Host diizinkan dari ALLOWED_CALLBACK_HOSTS.

function allowedHosts(): string[] {
  return (process.env.ALLOWED_CALLBACK_HOSTS ?? "asiacommerce.net,localhost")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** Kembalikan callbackUrl bila aman, atau fallback "/" bila tidak. */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const ok = allowedHosts().some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
    return ok ? url.toString() : "/";
  } catch {
    // Path relatif diperbolehkan
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/";
  }
}
