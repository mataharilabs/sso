import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  Package,
  Users2,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { APP_META } from "@/lib/constants";

const APP_ICONS: Record<string, typeof Package> = {
  ASET: Package,
  HRIS: Users2,
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dash");

  const apps = Object.entries(APP_META);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-accent-50/40 to-white">
      {/* Blobs dekoratif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-400/25 blur-3xl" />
        <div className="animate-blob absolute right-0 top-32 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl [animation-delay:3s]" />
        <div className="animate-blob absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent-300/20 blur-3xl [animation-delay:6s]" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="animate-fade-up flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-lg shadow-accent-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              AsiaCommerce ID
            </div>
            <div className="text-[11px] text-slate-400">Single Sign-On</div>
          </div>
        </div>
        <Link
          href="/login"
          className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
        >
          Masuk
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-6 text-center">
        <div className="animate-fade-up delay-100 mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-accent-700 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Satu akun untuk semua aplikasi AsiaCommerce
        </div>
        <h1 className="animate-fade-up delay-200 mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Masuk sekali, akses{" "}
          <span className="gradient-text">semua aplikasi</span> tanpa login ulang
        </h1>
        <p className="animate-fade-up delay-300 mx-auto mt-4 max-w-xl text-base text-slate-500">
          AsiaCommerce ID menghubungkan seluruh aplikasi bisnis Anda dalam satu
          identitas yang aman.
        </p>
        <div className="animate-fade-up delay-400 mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition-transform hover:scale-105 hover:bg-accent-600"
          >
            Mulai Masuk
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Showcase aplikasi */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8">
        <p className="animate-fade-up delay-300 mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Aplikasi dalam ekosistem
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map(([key, meta], i) => {
            const Icon = APP_ICONS[key] ?? Package;
            return (
              <div
                key={key}
                className="animate-fade-up group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-500/10"
                style={{ animationDelay: `${0.4 + i * 0.12}s` }}
              >
                <div className="animate-floaty mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-500/30">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {meta.name}
                  </h3>
                  {meta.live ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                      <Clock className="h-3 w-3" />
                      Segera
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {key} · asiacommerce.net
                </p>
                <div className="mt-4">
                  {meta.live ? (
                    <a
                      href={meta.url}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 transition-colors group-hover:text-accent-700"
                    >
                      Kunjungi aplikasi
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">Segera hadir</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 pb-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} AsiaCommerce. All rights reserved.
      </footer>
    </div>
  );
}
