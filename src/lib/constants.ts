// Pintasan cepat sebuah aplikasi (chip di kartu launchpad & hasil pencarian).
export type AppShortcut = { label: string; path: string };

// Metadata aplikasi terhubung (untuk launchpad /dash & landing publik).
// Satu-satunya tempat mendaftarkan aplikasi: cukup tambah entri di sini
// (ikon, warna, deskripsi, pintasan) tanpa mengubah kode halaman.
export type AppMeta = {
  name: string;
  url: string;
  live: boolean;
  // Konfigurasi tampilan launchpad (opsional agar landing lama tetap jalan):
  description?: string; // satu kalimat fungsi aplikasi (bukan domain)
  iconKey?: string; // pemilih ikon di launchpad (lihat ICONS di Launchpad.tsx)
  accent?: string; // warna aksen light mode (hex)
  accentDark?: string; // warna aksen dark mode (hex) — pastikan kontras cukup
  openToAll?: boolean; // true = semua karyawan bisa membuka tanpa role khusus
  shortcuts?: AppShortcut[];
};

export const APP_META: Record<string, AppMeta> = {
  ASET: {
    name: "Manajemen Aset",
    url: process.env.ASET_URL ?? "https://aset.asiacommerce.net",
    live: true,
    description: "Kelola dan pantau aset kantor.",
    iconKey: "aset",
    accent: "#0F766E",
    accentDark: "#2DD4BF",
    openToAll: false, // butuh pemberian akses eksplisit
    shortcuts: [
      { label: "Lihat aset", path: "/assets" },
      { label: "Scan aset", path: "/scan" },
      { label: "Self-assessment", path: "/assets?modal=self-assessment" },
    ],
  },
  HRIS: {
    name: "HRIS",
    url: process.env.HRIS_URL ?? "https://hris.asiacommerce.net",
    live: true,
    description: "Cuti, reimbursement, dan ruang meeting.",
    iconKey: "hris",
    accent: "#D6194B",
    accentDark: "#F0486F",
    openToAll: true, // semua karyawan punya HRIS
    shortcuts: [
      { label: "Ajukan cuti", path: "/leave?new=1" },
      { label: "Book ruang meeting", path: "/meeting-rooms" },
    ],
  },
  EVENT: {
    name: "Event",
    url: process.env.EVENT_URL ?? "https://event.asiacommerce.net",
    live: true,
    description: "Lihat acara dan kegiatan perusahaan.",
    iconKey: "event",
    accent: "#6D4AFF",
    accentDark: "#8B6FFF",
    openToAll: true, // semua karyawan bisa melihat event
    shortcuts: [{ label: "Lihat event", path: "/events" }],
  },
};

// Role per aplikasi (bisa berbeda tiap app). Dipakai UI manajemen user.
export const APP_ROLE_OPTIONS: Record<string, { value: string; label: string }[]> =
  {
    ASET: [
      { value: "SUPER_ADMIN", label: "Super Admin" },
      { value: "ASSET_MANAGER", label: "Asset Manager" },
      { value: "ASSET_HANDLER", label: "Asset Handler" },
    ],
    HRIS: [
      { value: "HR_ADMIN", label: "HR Admin" },
      { value: "HR_STAFF", label: "HR Staff" },
      { value: "EMPLOYEE", label: "Karyawan" },
    ],
    EVENT: [
      { value: "SUPER_ADMIN", label: "Super Admin" },
      { value: "EVENT_ADMIN", label: "Event Admin" },
    ],
  };

export const GENDER_LABELS: Record<string, string> = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
};

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: "Belum Menikah",
  MARRIED: "Menikah",
  DIVORCED: "Cerai",
  WIDOWED: "Janda/Duda",
};

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  PERMANENT: "Tetap (PKWTT)",
  CONTRACT: "Kontrak (PKWT)",
  INTERNSHIP: "Magang",
  FREELANCE: "Freelance",
};

// ---- Konfigurasi halaman depan publik (landing) ----

// Seberapa detail jadwal meeting tampil di halaman PUBLIK (sebelum login).
// Bisa diubah lewat env tanpa ubah kode. Nama pemesan TIDAK PERNAH ditampilkan.
//   none     → hanya jam + status ruangan
//   division → jam + divisi + status
//   title    → jam + judul + divisi + status (default)
export type PublicMeetingDetail = "none" | "division" | "title";

export const PUBLIC_MEETING_DETAIL: PublicMeetingDetail = (() => {
  const v = (process.env.PUBLIC_MEETING_DETAIL ?? "title").toLowerCase();
  return v === "none" || v === "division" ? v : "title";
})();

// Jadwal ruang meeting boleh tampil publik? (false = hanya setelah login).
export const PUBLIC_MEETING_ENABLED =
  (process.env.PUBLIC_MEETING_ENABLED ?? "true").toLowerCase() !== "false";

// Jam operasional ruang meeting (sumbu timeline), bisa diubah lewat env.
export const MEETING_HOURS = {
  start: Number(process.env.MEETING_HOUR_START ?? 8),
  end: Number(process.env.MEETING_HOUR_END ?? 18),
};
