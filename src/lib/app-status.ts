// Status aplikasi untuk lencana di halaman depan (Aktif/Gangguan/Pemeliharaan).
// Default "active" bila status tidak tersedia — jangan tampilkan error ke
// pengunjung. Ini titik integrasi API/health-check per aplikasi nanti.

export type AppStatus = "active" | "incident" | "maintenance";

export const APP_STATUS_LABEL: Record<AppStatus, string> = {
  active: "Aktif",
  incident: "Gangguan",
  maintenance: "Pemeliharaan",
};

/**
 * Ambil status tiap aplikasi. Saat ini mengembalikan "active" untuk semua
 * (belum ada sumber status). Ganti isi fungsi ini untuk memanggil API/health
 * check; tetap kembalikan "active" sebagai fallback aman bila gagal.
 */
export async function getAppStatuses(
  keys: string[]
): Promise<Record<string, AppStatus>> {
  const out: Record<string, AppStatus> = {};
  for (const k of keys) out[k] = "active";
  return out;
}
