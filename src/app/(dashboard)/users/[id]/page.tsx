import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UserForm, type UserFormInitial } from "@/components/users/UserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireSuperAdmin();
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, companyId: admin.companyId },
    select: {
      id: true,
      name: true,
      email: true,
      isSuperAdmin: true,
      phone: true,
      reportsToId: true,
      profile: true,
      appRoles: { select: { applicationKey: true, role: true } },
    },
  });
  if (!user) notFound();

  const initial = JSON.parse(JSON.stringify(user)) as UserFormInitial;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link href="/users" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />Kembali ke daftar pengguna
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit Pengguna</h1>
      <UserForm userId={user.id} initial={initial} />
    </div>
  );
}
