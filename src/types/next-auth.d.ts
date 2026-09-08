import type { DefaultSession } from "next-auth";

type AppRoleMap = Record<string, string>;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      apps: AppRoleMap;
      isSuperAdmin: boolean;
      companyId: string;
      companyName: string;
    } & DefaultSession["user"];
  }

  interface User {
    apps?: AppRoleMap;
    isSuperAdmin?: boolean;
    companyId?: string;
    companyName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    apps: AppRoleMap;
    isSuperAdmin: boolean;
    companyId: string;
    companyName: string;
  }
}
