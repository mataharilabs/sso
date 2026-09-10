import type { NextAuthConfig } from "next-auth";
import { safeCallbackUrl } from "@/lib/callback";

const isProd = process.env.NODE_ENV === "production";
// Di produksi, pastikan cookie ter-scope ke seluruh subdomain agar sesi
// terbagi (SSO ↔ ASET ↔ HRIS). Fallback aman bila COOKIE_DOMAIN lupa di-set.
const cookieDomain =
  process.env.COOKIE_DOMAIN || (isProd ? ".asiacommerce.net" : undefined);

// Nama cookie HARUS identik di semua app (SSO/ASET/HRIS) — dipakai sebagai
// salt enkripsi JWT Auth.js, sehingga token bisa didekripsi lintas app.
const sessionCookieName = isProd
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

// Konfigurasi edge-safe (tanpa Prisma/bcrypt). Dipakai middleware & auth.ts.
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        domain: cookieDomain, // .asiacommerce.net di produksi
      },
    },
  },
  callbacks: {
    // Izinkan redirect lintas-subdomain *.asiacommerce.net (default Auth.js hanya same-origin)
    redirect({ url, baseUrl }) {
      const safe = safeCallbackUrl(url);
      if (safe === "/") return baseUrl;
      return safe.startsWith("/") ? `${baseUrl}${safe}` : safe;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isPublic =
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/logout") ||
        path === "/";
      if (isPublic) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.apps = user.apps ?? {};
        token.isSuperAdmin = Boolean(user.isSuperAdmin);
        token.companyId = user.companyId as string;
        token.companyName = user.companyName as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.apps = (token.apps as Record<string, string>) ?? {};
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
