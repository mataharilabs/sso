import Link from "next/link";
import { ArrowRight, AppWindow, Clock, Settings } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP_META, APP_ROLE_OPTIONS } from "@/lib/constants";

function roleLabel(appKey: string, role: string): string {
  const opt = APP_ROLE_OPTIONS[appKey]?.find((o) => o.value === role);
  return opt?.label ?? role;
}

export default async function DashPage() {
  const user = await requireUser();

  const appRoles = await prisma.userAppRole.findMany({
    where: { userId: user.id },
    orderBy: { applicationKey: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Halo, {user.name ?? user.email} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Aplikasi AsiaCommerce yang bisa Anda akses.
        </p>
      </div>

      {appRoles.length === 0 ? (
        <Card className="p-10 text-center">
          <AppWindow className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-800">Belum ada akses aplikasi</p>
          <p className="mt-1 text-sm text-slate-500">
            Hubungi admin untuk diberi akses ke aplikasi.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appRoles.map((r) => {
            const meta = APP_META[r.applicationKey];
            const name = meta?.name ?? r.applicationKey;
            const live = meta?.live ?? false;
            return (
              <Card key={r.applicationKey} className="flex flex-col p-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <AppWindow className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-slate-900">
                    {name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {r.applicationKey} · {roleLabel(r.applicationKey, r.role)}
                  </div>
                </div>
                <div className="mt-4">
                  {live && meta ? (
                    <a href={meta.url} target="_self">
                      <Button className="w-full">
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
      )}

      {user.isSuperAdmin && (
        <Card className="flex items-center justify-between p-5">
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
