// Metadata aplikasi terhubung: URL & status ketersediaan (untuk launchpad /dash).
export type AppMeta = { name: string; url: string; live: boolean };

export const APP_META: Record<string, AppMeta> = {
  ASET: {
    name: "Manajemen Aset",
    url: process.env.ASET_URL ?? "https://aset.asiacommerce.net",
    live: true,
  },
  HRIS: {
    name: "HRIS",
    url: process.env.HRIS_URL ?? "https://hris.asiacommerce.net",
    live: false, // belum ada website → tampil "Segera hadir"
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
