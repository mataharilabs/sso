import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { OfficesManager } from "@/components/master/OfficesManager";

export default async function OfficesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) redirect("/dash");

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Lokasi Kantor</h1>
        <p className="text-sm text-slate-500">
          Kelola daftar kantor (utama/cabang) yang muncul saat menambah/mengedit
          pengguna dan sebagai lokasi aset.
        </p>
      </div>
      <OfficesManager />
    </div>
  );
}
