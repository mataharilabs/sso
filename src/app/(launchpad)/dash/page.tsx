import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildLaunchpadApps } from "@/lib/apps";
import { initials } from "@/lib/utils";
import Launchpad from "@/components/launchpad/Launchpad";

const TZ = "Asia/Jakarta";

function greetingFor(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashPage() {
  const user = await requireUser();

  // Nama panggilan (nickname) untuk sapaan — fallback ke nama depan.
  const profile = await prisma.userProfile
    .findUnique({ where: { userId: user.id }, select: { nickname: true } })
    .catch(() => null);
  const firstName =
    profile?.nickname?.trim() ||
    user.name?.trim().split(/\s+/)[0] ||
    "Rekan";

  // Waktu & tanggal dihitung di server dengan TZ konsisten (Asia/Jakarta).
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("id-ID", {
      hour: "numeric",
      hour12: false,
      timeZone: TZ,
    }).format(now)
  );
  const greeting = greetingFor(hour);
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(now);

  const { mine, locked } = buildLaunchpadApps(user);

  const roleSubtitle = `${user.isSuperAdmin ? "Admin Platform" : "Karyawan"} · ${
    user.companyName ?? "AsiaCommerce"
  }`;

  const adminLinks = user.isSuperAdmin
    ? [
        { label: "Kelola Pengguna", href: "/users" },
        { label: "Departemen", href: "/departments" },
        { label: "Kantor", href: "/offices" },
        { label: "Setelan", href: "/settings" },
      ]
    : [];

  return (
    <Launchpad
      userId={user.id}
      fullName={user.name ?? user.email ?? "Pengguna"}
      firstName={firstName}
      greeting={greeting}
      dateStr={dateStr}
      roleSubtitle={roleSubtitle}
      initials={initials(user.name ?? user.email)}
      mine={mine}
      locked={locked}
      adminLinks={adminLinks}
    />
  );
}
