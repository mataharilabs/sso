import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  apps: Record<string, string>;
  isSuperAdmin: boolean;
  companyId: string;
  companyName: string;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Tidak terautentikasi", 401);
  return user;
}

/** Wajib admin platform (kelola SSO). */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isSuperAdmin) throw new AuthError("Akses ditolak", 403);
  return user;
}
