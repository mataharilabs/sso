/**
 * Normalisasi nomor telepon Indonesia ke format E.164 tanpa "+" (62xxxx),
 * siap dipakai sebagai JID WhatsApp. Kembalikan null bila jelas tidak valid.
 */
export function normalizePhone(input?: string | null): string | null {
  if (!input) return null;
  let d = input.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  // 62 diikuti 8..11 digit nomor
  if (!/^62\d{8,13}$/.test(d)) return null;
  return d;
}
