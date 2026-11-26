import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles, Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { safeCallbackUrl } from "@/lib/callback";
import { APP_META } from "@/lib/constants";
import LoginPanel from "@/components/auth/LoginPanel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  // Sudah login → teruskan ke app asal (callbackUrl) atau launchpad.
  const user = await getCurrentUser();
  if (user) {
    const target = callbackUrl ? safeCallbackUrl(callbackUrl) : "/dash";
    redirect(target === "/" ? "/dash" : target);
  }

  // Chip aplikasi diambil dari konfigurasi (bukan hardcode).
  const appNames = Object.values(APP_META)
    .filter((m) => m.live)
    .map((m) => m.name);

  return (
    <>
      <section className="hero">
        <div className="bl b1" />
        <div className="bl b2" />
        <div className="lg">
          <i>
            <ShieldCheck size={24} strokeWidth={2} />
          </i>
          <div>
            <b>AsiaCommerce ID</b>
            <small>Single Sign-On</small>
          </div>
        </div>
        <div>
          <span className="bd">
            <Sparkles size={15} strokeWidth={2} />
            Satu akun untuk semua aplikasi
          </span>
          <h1>Login sekali, akses semua aplikasi AsiaCommerce</h1>
          <p>
            ASET, HRIS, dan aplikasi lainnya dalam satu identitas yang aman,
            tanpa login ulang.
          </p>
          <div className="apps">
            {appNames.map((name) => (
              <span key={name}>
                <i />
                {name}
              </span>
            ))}
          </div>
          <div className="sec">
            <Lock size={16} strokeWidth={2} />
            Kode OTP sekali pakai dan berlaku singkat
          </div>
        </div>
      </section>

      <LoginPanel callbackUrl={callbackUrl ?? "/"} />
    </>
  );
}
