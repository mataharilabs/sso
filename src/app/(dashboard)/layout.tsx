import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Users, LogOut, LayoutGrid, Building, Briefcase, Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { initials } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand-50/30 to-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/dash" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                AsiaCommerce ID
              </div>
              <div className="text-[11px] text-slate-400">Single Sign-On</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/dash"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LayoutGrid className="h-4 w-4" />
              Aplikasi
            </Link>
            {user.isSuperAdmin && (
              <>
                <Link
                  href="/users"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Users className="h-4 w-4" />
                  Pengguna
                </Link>
                <Link
                  href="/departments"
                  className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex"
                >
                  <Briefcase className="h-4 w-4" />
                  Departemen
                </Link>
                <Link
                  href="/offices"
                  className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex"
                >
                  <Building className="h-4 w-4" />
                  Kantor
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </>
            )}
            <div className="mx-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {initials(user.name)}
              </div>
              <a
                href="/logout"
                className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </a>
            </div>
          </nav>
        </div>
      </header>
      <main className="animate-fade-up mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
