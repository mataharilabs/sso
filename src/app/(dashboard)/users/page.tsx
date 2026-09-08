import { requireSuperAdmin } from "@/lib/session";
import { UsersList } from "@/components/users/UsersList";

export default async function UsersPage() {
  const admin = await requireSuperAdmin();
  return <UsersList currentUserId={admin.id} />;
}
