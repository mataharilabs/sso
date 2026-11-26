import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  ShieldCheck,
  Sparkles,
  Check,
  ArrowRight,
  Package,
  Users,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import {
  APP_META,
  PUBLIC_MEETING_DETAIL,
  PUBLIC_MEETING_ENABLED,
  MEETING_HOURS,
} from "@/lib/constants";
import { getAppStatuses, APP_STATUS_LABEL } from "@/lib/app-status";
import MeetingSchedule from "@/components/public/MeetingSchedule";
import "./landing.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const ICONS: Record<string, LucideIcon> = {
  aset: Package,
  hris: Users,
  event: CalendarDays,
};

const VALUE_POINTS = [
  "Kode OTP lewat WhatsApp",
  "Satu identitas untuk semua aplikasi",
  "Tanpa login ulang",
];

// Waktu server (WIB) untuk timeline & footer — bukan jam perangkat pengunjung.
// Dipisah ke fungsi biasa agar lepas dari aturan kemurnian komponen.
function serverClock() {
  const now = new Date();
  return {
    ms: now.getTime(),
    today: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
    }).format(now),
    year: new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
    }).format(now),
  };
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dash");

  const statuses = await getAppStatuses(Object.keys(APP_META));

  // Daftar aplikasi dari konfigurasi (APP_META) — tambah app = tambah entri.
  const apps = Object.entries(APP_META)
    .filter(([, m]) => m.live)
    .map(([key, m]) => {
      let host = "";
      try {
        host = new URL(m.url).host;
      } catch {
        host = m.url;
      }
      const status = statuses[key] ?? "active";
      return {
        key,
        name: m.name,
        description: m.description ?? "",
        host,
        iconKey: m.iconKey ?? "app",
        accent: m.accent ?? "#D6194B",
        accentDark: m.accentDark ?? m.accent ?? "#F0486F",
        status,
        statusLabel: APP_STATUS_LABEL[status],
        // Klik → login dengan tujuan aplikasi (divalidasi safeCallbackUrl saat login).
        loginHref: `/login?callbackUrl=${encodeURIComponent(m.url)}`,
      };
    });

  const { ms: serverNowMs, today, year } = serverClock();

  return (
    <div className={`lnd ${jakarta.variable}`}>
      <div className="bg" aria-hidden="true">
        <i />
        <i />
      </div>

      <div className="w">
        <header className="hd">
          <div className="lg">
            <i>
              <ShieldCheck size={22} strokeWidth={2} />
            </i>
            <div>
              <b>AsiaCommerce ID</b>
              <small>Single Sign-On</small>
            </div>
          </div>
          <Link className="btn g" href="/login">
            Masuk
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </header>

        <section className="hero">
          <span className="bd">
            <Sparkles size={15} strokeWidth={2} />
            Satu akun untuk semua aplikasi AsiaCommerce
          </span>
          <h1>
            Masuk sekali, akses <em>semua aplikasi</em> tanpa login ulang
          </h1>
          <p className="lead">
            AsiaCommerce ID menghubungkan seluruh aplikasi bisnis Anda dalam satu
            identitas yang aman.
          </p>
          <div className="cta">
            <Link className="btn p" href="/login">
              Mulai masuk
              <ArrowRight size={17} strokeWidth={2.2} />
            </Link>
            <a className="btn g" href="#jadwal">
              Lihat jadwal ruang meeting
            </a>
          </div>
          <div className="vp">
            {VALUE_POINTS.map((t) => (
              <span key={t}>
                <Check size={17} strokeWidth={2.4} />
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="sec" id="apl">
          <div className="st">
            <p className="eb">Aplikasi dalam ekosistem</p>
            <h2>Semua kebutuhan kerja, satu pintu masuk</h2>
          </div>
          <div className="gr">
            {apps.map((a) => {
              const Icon = ICONS[a.iconKey] ?? Package;
              return (
                <Link
                  key={a.key}
                  className="ap"
                  href={a.loginHref}
                  style={
                    {
                      ["--a-l"]: a.accent,
                      ["--a-d"]: a.accentDark,
                    } as React.CSSProperties
                  }
                >
                  <div className="ic">
                    <Icon size={28} strokeWidth={1.9} />
                  </div>
                  <h3>
                    {a.name}
                    <span className={`live ${a.status !== "active" ? "warn" : ""}`}>
                      {a.statusLabel}
                    </span>
                  </h3>
                  <p>{a.description}</p>
                  <span className="dm">{a.host}</span>
                  <span className="go">
                    <span>Masuk untuk membuka</span>
                    <ArrowRight size={17} strokeWidth={2.2} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {PUBLIC_MEETING_ENABLED && (
          <MeetingSchedule
            hrisUrl={APP_META.HRIS.url}
            detail={PUBLIC_MEETING_DETAIL}
            startHour={MEETING_HOURS.start}
            endHour={MEETING_HOURS.end}
            serverNowMs={serverNowMs}
            today={today}
          />
        )}

        <footer className="ft">
          © {year} AsiaCommerce. Butuh bantuan akses? Hubungi <b>HR Admin</b>.
        </footer>
      </div>
    </div>
  );
}
