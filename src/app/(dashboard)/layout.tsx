import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Users, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { initials } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) {
    // Bukan admin platform — tidak ada UI untuk dikelola di SSO
    redirect("/logout");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/users" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">AsiaCommerce ID</div>
              <div className="text-[11px] text-slate-400">Single Sign-On Admin</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/users"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Users className="h-4 w-4" />
              Pengguna
            </Link>
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
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
