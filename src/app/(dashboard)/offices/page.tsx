import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MasterManager } from "@/components/master/MasterManager";
import { COUNTRIES } from "@/lib/countries";

export default async function OfficesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) redirect("/dash");

  const countryOptions = [
    { value: "", label: "- Pilih Negara -" },
    ...COUNTRIES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Lokasi Kantor</h1>
        <p className="text-sm text-slate-500">
          Kelola daftar kantor (utama/cabang) yang muncul saat menambah/mengedit
          pengguna.
        </p>
      </div>
      <MasterManager
        endpoint="/api/offices"
        entityLabel="Lokasi Kantor"
        fields={[
          { name: "name", label: "Nama Kantor", required: true },
          { name: "country", label: "Negara", type: "select", options: countryOptions },
          { name: "province", label: "Provinsi" },
          { name: "city", label: "Kota" },
          { name: "address", label: "Alamat", type: "textarea" },
          { name: "isPrimary", label: "Kantor Utama", type: "checkbox" },
        ]}
        columns={[
          { key: "name", label: "Nama" },
          { key: "city", label: "Kota" },
          { key: "country", label: "Negara" },
          { key: "isPrimary", label: "Utama" },
        ]}
      />
    </div>
  );
}
