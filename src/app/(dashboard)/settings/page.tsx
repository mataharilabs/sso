import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { NotificationSettingsClient } from "@/components/settings/NotificationSettingsClient";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) redirect("/dash");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Setelan platform. Notifikasi WhatsApp &amp; Email dikelola terpusat di
          sini dan dipakai oleh SSO, ASET, dan HRIS.
        </p>
      </div>
      <NotificationSettingsClient />
    </div>
  );
}
