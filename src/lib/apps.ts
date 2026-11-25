// Logika daftar aplikasi untuk launchpad SSO (/dash).
//
// Model akses (lihat brief):
//  - "Akses aplikasi": apakah pengguna boleh membuka aplikasi sama sekali.
//  - "Peran di dalam aplikasi": Karyawan, Asset Handler, Admin, dst.
//
// Sebuah aplikasi bisa diakses bila:
//  - openToAll = true (semua karyawan, mis. HRIS & Event), ATAU
//  - pengguna punya role eksplisit untuk aplikasi itu (UserAppRole), ATAU
//  - pengguna adalah admin platform SSO (isSuperAdmin).
//
// Aplikasi yang openToAll tetapi pengguna tak punya role khusus → lencana
// "Karyawan". Hanya aplikasi yang sama sekali tak bisa diakses yang masuk
// ke "Aplikasi lain" (locked).
import { APP_META, APP_ROLE_OPTIONS, type AppShortcut } from "@/lib/constants";
import type { SessionUser } from "@/lib/session";

// Bentuk aplikasi yang dikirim ke komponen klien (harus serializable).
export type LaunchpadApp = {
  key: string;
  name: string;
  description: string;
  iconKey: string;
  accent: string;
  accentDark: string;
  url: string;
  roleLabel: string;
  hasAccess: boolean;
  shortcuts: AppShortcut[];
  /** Jumlah notifikasi (opsional). Hanya tampil bila aplikasi menyediakan. */
  badge?: number;
};

const DEFAULT_ROLE_LABEL = "Karyawan";

/** Label peran tertinggi pengguna untuk sebuah aplikasi. */
function roleLabelFor(appKey: string, user: SessionUser): string {
  const role = user.apps?.[appKey];
  if (role) {
    return (
      APP_ROLE_OPTIONS[appKey]?.find((o) => o.value === role)?.label ?? role
    );
  }
  if (user.isSuperAdmin) return "Super Admin";
  return DEFAULT_ROLE_LABEL; // openToAll tanpa role khusus
}

function toLaunchpadApp(
  key: string,
  user: SessionUser,
  hasAccess: boolean
): LaunchpadApp {
  const meta = APP_META[key];
  return {
    key,
    name: meta.name,
    description: meta.description ?? "",
    iconKey: meta.iconKey ?? "app",
    accent: meta.accent ?? "#D6194B",
    accentDark: meta.accentDark ?? meta.accent ?? "#F0486F",
    url: meta.url,
    roleLabel: roleLabelFor(key, user),
    hasAccess,
    shortcuts: hasAccess ? meta.shortcuts ?? [] : [],
  };
}

/**
 * Bagi aplikasi menjadi:
 *  - mine   : bisa dibuka pengguna (tampil di "Aplikasi saya")
 *  - locked : sama sekali tak bisa diakses (tampil di "Aplikasi lain")
 */
export function buildLaunchpadApps(user: SessionUser): {
  mine: LaunchpadApp[];
  locked: LaunchpadApp[];
} {
  const mine: LaunchpadApp[] = [];
  const locked: LaunchpadApp[] = [];

  for (const [key, meta] of Object.entries(APP_META)) {
    if (!meta.live) continue;
    const hasAccess =
      Boolean(meta.openToAll) ||
      Boolean(user.apps?.[key]) ||
      user.isSuperAdmin;
    (hasAccess ? mine : locked).push(toLaunchpadApp(key, user, hasAccess));
  }

  return { mine, locked };
}
