import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { verifyLoginOtp } from "@/lib/login-otp";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type UserWithRoles = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isSuperAdmin: boolean;
  companyId: string;
  company: { name: string };
  appRoles: { applicationKey: string; role: string }[];
};

// Bentuk objek user untuk klaim JWT (dipakai app lain lewat cookie bersama).
function toAuthUser(user: UserWithRoles) {
  const apps: Record<string, string> = {};
  for (const r of user.appRoles) apps[r.applicationKey] = r.role;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    apps,
    isSuperAdmin: user.isSuperAdmin,
    companyId: user.companyId,
    companyName: user.company.name,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Login dengan sandi
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { company: true, appRoles: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return toAuthUser(user);
      },
    }),
    // Login dengan kode OTP (email + WhatsApp)
    Credentials({
      id: "otp",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Kode", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const code = String(credentials?.code ?? "");
        if (!email || code.length < 4) return null;

        const user = await verifyLoginOtp(email, code);
        if (!user || !user.isActive) return null;

        return toAuthUser(user);
      },
    }),
  ],
});
