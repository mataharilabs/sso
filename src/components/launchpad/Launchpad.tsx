"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  Search,
  Star,
  Lock,
  Info,
  ArrowRight,
  Package,
  Users,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import type { LaunchpadApp } from "@/lib/apps";
import type { AgendaItem, AgendaTone } from "@/lib/agenda";

type AdminLink = { label: string; href: string };

type Props = {
  userId: string;
  fullName: string;
  firstName: string;
  greeting: string;
  dateStr: string;
  roleSubtitle: string;
  initials: string;
  mine: LaunchpadApp[];
  locked: LaunchpadApp[];
  adminLinks: AdminLink[];
};

// Ikon per aplikasi (berbeda per app, dipilih lewat iconKey di konfigurasi).
const ICONS: Record<string, LucideIcon> = {
  aset: Package,
  hris: Users,
  event: CalendarDays,
};
function appIcon(key: string): LucideIcon {
  return ICONS[key] ?? Package;
}

const TONE_VAR: Record<AgendaTone, string> = {
  warn: "var(--lp-warn)",
  brand: "var(--lp-brand)",
  ok: "var(--lp-ok)",
};

// Helper style var aksen (light/dark) — CSS yang memilih mana yang dipakai.
function accentStyle(accent: string, accentDark: string): React.CSSProperties {
  return { ["--a-l"]: accent, ["--a-d"]: accentDark } as React.CSSProperties;
}

function relTime(ts?: number): string {
  if (!ts) return "Belum pernah dibuka";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Baru saja dibuka";
  if (min < 60) return `Dibuka ${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Dibuka ${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Dibuka kemarin";
  if (day < 7) return `Dibuka ${day} hari lalu`;
  return "Dibuka lebih dari seminggu lalu";
}

type AgendaState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: AgendaItem[] };

type SearchResult = {
  app: LaunchpadApp;
  title: string;
  sub: string;
  kind: "app" | "shortcut";
  path?: string;
};

export default function Launchpad({
  userId,
  fullName,
  firstName,
  greeting,
  dateStr,
  roleSubtitle,
  initials,
  mine,
  locked,
  adminLinks,
}: Props) {
  const favKey = `lp:fav:${userId}`;
  const openedKey = `lp:opened:${userId}`;

  // Favorit & "terakhir dibuka" disimpan di localStorage (per pengguna).
  // Mulai kosong agar render server & render klien pertama identik, lalu
  // dimuat dari localStorage setelah mount.
  const [favs, setFavs] = useState<string[]>([]);
  const [opened, setOpened] = useState<Record<string, number>>({});

  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [notice, setNotice] = useState("");
  const [agenda, setAgenda] = useState<AgendaState>({ status: "loading" });

  const inputRef = useRef<HTMLInputElement>(null);

  // Muat favorit & terakhir-dibuka dari localStorage setelah mount.
  useEffect(() => {
    try {
      const f = localStorage.getItem(favKey);
      const o = localStorage.getItem(openedKey);
      // Hidrasi dari localStorage (khusus klien) setelah mount — disengaja di
      // effect agar render server & klien pertama identik (hindari mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (f) setFavs(JSON.parse(f));
      if (o) setOpened(JSON.parse(o));
    } catch {
      /* abaikan localStorage yang rusak */
    }
  }, [favKey, openedKey]);

  // Muat agenda (sumber HRIS) secara terpisah — gagalnya tidak merusak halaman.
  useEffect(() => {
    let alive = true;
    fetch("/api/me/agenda")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((d: { items?: AgendaItem[] }) => {
        if (alive) setAgenda({ status: "ready", items: d.items ?? [] });
      })
      .catch(() => {
        if (alive) setAgenda({ status: "error" });
      });
    return () => {
      alive = false;
    };
  }, []);

  const allApps = useMemo(() => [...mine, ...locked], [mine, locked]);

  // Favorit naik ke urutan pertama (stabil).
  const orderedMine = useMemo(() => {
    return [...mine].sort(
      (a, b) =>
        (favs.includes(b.key) ? 1 : 0) - (favs.includes(a.key) ? 1 : 0)
    );
  }, [mine, favs]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    const out: SearchResult[] = [];
    for (const app of allApps) {
      if (!q || app.name.toLowerCase().includes(q)) {
        out.push({
          app,
          title: app.name,
          sub: app.hasAccess ? "Aplikasi" : "Tidak ada akses",
          kind: "app",
        });
      }
      if (q) {
        for (const sc of app.shortcuts) {
          if (sc.label.toLowerCase().includes(q)) {
            out.push({
              app,
              title: sc.label,
              sub: app.name,
              kind: "shortcut",
              path: sc.path,
            });
          }
        }
      }
    }
    return out.filter(
      (r, i, arr) =>
        arr.findIndex((x) => x.title === r.title && x.sub === r.sub) === i
    );
  }, [query, allApps]);

  const safeSel = results.length ? Math.min(sel, results.length - 1) : 0;

  // Fokus ke input saat palette dibuka.
  useEffect(() => {
    if (paletteOpen) inputRef.current?.focus();
  }, [paletteOpen]);

  function openPalette() {
    setQuery("");
    setSel(0);
    setNotice("");
    setPaletteOpen(true);
  }

  function recordOpen(key: string) {
    const next = { ...opened, [key]: Date.now() };
    try {
      localStorage.setItem(openedKey, JSON.stringify(next));
    } catch {
      /* abaikan */
    }
    setOpened(next);
  }

  function openApp(app: LaunchpadApp) {
    recordOpen(app.key);
    window.location.href = app.url;
  }

  function openShortcut(app: LaunchpadApp, path: string) {
    recordOpen(app.key);
    window.location.href = app.url + path;
  }

  function toggleFav(key: string) {
    const next = favs.includes(key)
      ? favs.filter((k) => k !== key)
      : [...favs, key];
    try {
      localStorage.setItem(favKey, JSON.stringify(next));
    } catch {
      /* abaikan */
    }
    setFavs(next);
  }

  function pick(i: number) {
    const r = results[i];
    if (!r) return;
    if (!r.app.hasAccess) {
      setNotice(`Hubungi HR Admin untuk meminta akses ke ${r.app.name}`);
      return;
    }
    setPaletteOpen(false);
    if (r.kind === "shortcut" && r.path) openShortcut(r.app, r.path);
    else openApp(r.app);
  }

  // Keyboard global: Ctrl/Cmd+K, Esc, panah, Enter.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setMenuOpen(false);
        return;
      }
      if (!paletteOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        pick(safeSel);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen, results, safeSel]);

  // Tutup menu akun saat klik di luar.
  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest(".um")) setMenuOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  return (
    <>
      <header className="hd">
        <div className="hi">
          <a className="lg" href="/dash">
            <i>
              <ShieldCheck size={20} strokeWidth={2} />
            </i>
            <div>
              <b>AsiaCommerce ID</b>
              <small>Single Sign-On</small>
            </div>
          </a>

          <button
            className="sb"
            onClick={openPalette}
            aria-label="Cari aplikasi atau menu"
          >
            <Search size={17} strokeWidth={2.2} />
            <span>Cari aplikasi atau menu</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="um">
            <button
              className="av"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu akun"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="mn" role="menu">
                <div className="u">
                  <b>{fullName}</b>
                  <small>{roleSubtitle}</small>
                </div>
                {adminLinks.map((l) => (
                  <a key={l.href} role="menuitem" href={l.href}>
                    {l.label}
                  </a>
                ))}
                {adminLinks.length > 0 && <div className="sep" />}
                <a role="menuitem" href="/logout">
                  Keluar
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w">
        <h1>
          {greeting}, {firstName} 👋
        </h1>
        <p className="sub">
          Semua aplikasi AsiaCommerce dalam satu tempat · {dateStr}
        </p>

        <div className="lay">
          <div>
            <h2>Aplikasi saya</h2>
            <div className="gr">
              {orderedMine.map((app) => {
                const Icon = appIcon(app.iconKey);
                const isFav = favs.includes(app.key);
                return (
                  <article
                    key={app.key}
                    className="app"
                    style={accentStyle(app.accent, app.accentDark)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Buka ${app.name}`}
                    onClick={() => openApp(app)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openApp(app);
                    }}
                  >
                    <div className="top">
                      <div className="ic">
                        <Icon size={24} strokeWidth={1.9} />
                        {app.badge ? (
                          <span
                            className="nb"
                            title={`${app.badge} perlu perhatian`}
                          >
                            {app.badge}
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <h3>{app.name}</h3>
                        <span className="rl">{app.roleLabel}</span>
                      </div>
                      <button
                        className={`fv ${isFav ? "on" : ""}`}
                        aria-pressed={isFav}
                        aria-label={
                          isFav ? "Hapus dari favorit" : "Jadikan favorit"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav(app.key);
                        }}
                      >
                        <Star
                          size={22}
                          strokeWidth={2}
                          fill={isFav ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    <p className="ds">{app.description}</p>

                    {app.shortcuts.length > 0 && (
                      <div className="cs">
                        {app.shortcuts.map((sc) => (
                          <button
                            key={sc.path}
                            className="chip"
                            onClick={(e) => {
                              e.stopPropagation();
                              openShortcut(app, sc.path);
                            }}
                          >
                            {sc.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="ft">
                      <span>{relTime(opened[app.key])}</span>
                      <ArrowRight size={16} strokeWidth={2.2} />
                    </div>
                  </article>
                );
              })}
            </div>

            {locked.length > 0 && (
              <>
                <h2>Aplikasi lain</h2>
                <div className="gr">
                  {locked.map((app) => {
                    const Icon = appIcon(app.iconKey);
                    return (
                      <article
                        key={app.key}
                        className="app lk"
                        style={accentStyle(app.accent, app.accentDark)}
                      >
                        <div className="top">
                          <div className="ic">
                            <Icon size={24} strokeWidth={1.9} />
                          </div>
                          <div>
                            <h3>{app.name}</h3>
                            <span className="lkb">
                              <Lock size={11} strokeWidth={2.6} />
                              Belum ada akses
                            </span>
                          </div>
                        </div>
                        <p className="ds">{app.description}</p>
                        <div className="nfo">
                          <Info size={16} strokeWidth={2} />
                          <span>
                            Belum ada akses. Hubungi <b>HR Admin</b> untuk
                            meminta akses ke aplikasi ini.
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <aside className="pn">
            <h2>Agenda Anda</h2>
            <AgendaPanel state={agenda} />
          </aside>
        </div>
      </main>

      {paletteOpen && (
        <div
          className="ov"
          role="dialog"
          aria-modal="true"
          aria-label="Cari aplikasi atau menu"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPaletteOpen(false);
          }}
        >
          <div className="pl">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSel(0);
                setNotice("");
              }}
              placeholder="Cari aplikasi atau menu, mis. cuti"
              autoComplete="off"
              aria-label="Cari aplikasi atau menu"
            />
            {notice && <div className="notice">{notice}</div>}
            <div className="rs">
              {results.length ? (
                results.map((r, i) => {
                  const Icon = appIcon(r.app.iconKey);
                  return (
                    <div
                      key={`${r.title}-${r.sub}`}
                      className={`r ${i === safeSel ? "on" : ""}`}
                      onMouseEnter={() => setSel(i)}
                      onClick={() => pick(i)}
                    >
                      <span
                        className="ic"
                        style={{ background: r.app.accent, color: "#fff" }}
                      >
                        <Icon size={18} strokeWidth={1.9} />
                      </span>
                      <b>{r.title}</b>
                      <small>{r.sub}</small>
                    </div>
                  );
                })
              ) : (
                <div className="em" style={{ padding: "18px 12px" }}>
                  Tidak ada hasil untuk “{query}”.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AgendaPanel({ state }: { state: AgendaState }) {
  if (state.status === "loading")
    return <div className="em">Memuat agenda…</div>;
  if (state.status === "error")
    return (
      <div className="em">Agenda gagal dimuat. Coba muat ulang halaman.</div>
    );
  if (state.items.length === 0)
    return <div className="em">Belum ada agenda.</div>;

  return (
    <>
      {state.items.map((it) => (
        <div
          key={it.id}
          className="it"
          style={{ ["--a"]: TONE_VAR[it.tone] } as React.CSSProperties}
        >
          <span className="dot" />
          <div>
            <span className="kd">{it.kicker}</span>
            <b>{it.title}</b>
            <small>{it.detail}</small>
            <br />
            <a className="lnk" href={it.href}>
              Buka →
            </a>
          </div>
        </div>
      ))}
    </>
  );
}
