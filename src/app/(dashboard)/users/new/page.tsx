import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/session";
import { UserForm } from "@/components/users/UserForm";

export default async function NewUserPage() {
  await requireSuperAdmin();
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link href="/users" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />Kembali ke daftar pengguna
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Tambah Pengguna</h1>
      <UserForm />
    </div>
  );
}
