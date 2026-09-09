import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { UsersList } from "@/components/users/UsersList";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) redirect("/dash");
  return <UsersList currentUserId={user.id} />;
}
