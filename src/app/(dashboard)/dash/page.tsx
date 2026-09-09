import Link from "next/link";
import { ArrowRight, Clock, Settings, Package, Users2, Ban } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_META, APP_ROLE_OPTIONS } from "@/lib/constants";

const APP_ICONS: Record<string, typeof Package> = {
  ASET: Package,
  HRIS: Users2,
};

function roleLabel(appKey: string, role: string): string {
  return APP_ROLE_OPTIONS[appKey]?.find((o) => o.value === role)?.label ?? role;
}

export default async function DashPage() {
  const user = await requireUser();

  const appRoles = await prisma.userAppRole.findMany({
    where: { userId: user.id },
  });
  const roleByApp = new Map(appRoles.map((r) => [r.applicationKey, r.role]));

  const apps = Object.entries(APP_META);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-slate-900">
          Halo, {user.name ?? user.email} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Semua aplikasi AsiaCommerce dalam satu tempat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map(([key, meta], i) => {
          const Icon = APP_ICONS[key] ?? Package;
          const role = roleByApp.get(key);
          const hasAccess = Boolean(role);
          return (
            <Card
              key={key}
              className="animate-fade-up flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-md shadow-accent-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                {hasAccess ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {roleLabel(key, role!)}
                  </Badge>
                ) : (
                  <Badge className="border-red-200 bg-red-50 text-red-600">
                    <Ban className="mr-1 h-3 w-3" />
                    Tidak ada akses
                  </Badge>
                )}
              </div>

              <div className="flex-1">
                <div className="text-base font-semibold text-slate-900">
                  {meta.name}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {key} · asiacommerce.net
                </div>
                {!hasAccess && (
                  <p className="mt-2 text-xs text-slate-400">
                    Anda belum diberi akses ke aplikasi ini. Hubungi admin.
                  </p>
                )}
              </div>

              <div className="mt-4">
                {meta.live ? (
                  <a href={meta.url} target="_self">
                    <Button
                      className="w-full"
                      variant={hasAccess ? "default" : "outline"}
                    >
                      Buka Aplikasi
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    <Clock className="h-4 w-4" />
                    Segera hadir
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {user.isSuperAdmin && (
        <Card className="animate-fade-up flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Administrasi SSO
              </div>
              <div className="text-xs text-slate-500">
                Kelola pengguna & akses aplikasi
              </div>
            </div>
          </div>
          <Link href="/users">
            <Button variant="outline">Kelola Pengguna</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
