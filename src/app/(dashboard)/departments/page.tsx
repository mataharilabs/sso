import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MasterManager } from "@/components/master/MasterManager";

export default async function DepartmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) redirect("/dash");

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Departemen / Divisi</h1>
        <p className="text-sm text-slate-500">
          Kelola daftar departemen yang muncul saat menambah/mengedit pengguna.
        </p>
      </div>
      <MasterManager
        endpoint="/api/departments"
        entityLabel="Departemen"
        fields={[{ name: "name", label: "Nama Departemen", required: true }]}
        columns={[{ key: "name", label: "Nama" }]}
      />
    </div>
  );
}
