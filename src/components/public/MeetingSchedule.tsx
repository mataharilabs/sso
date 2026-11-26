"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, RotateCw } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import type { PublicMeetingDetail } from "@/lib/constants";

type Room = { id: string; name: string };
type Booking = {
  id: string;
  roomId: string;
  title: string;
  department: string | null;
  startAt: string;
  endAt: string;
  status: "BOOKED" | "CHECKED_IN" | "AUTO_CHECKED_IN";
  seriesId?: string | null;
  // Catatan: field nama pemesan TIDAK PERNAH dipakai/ditampilkan di halaman publik.
};

type Props = {
  hrisUrl: string;
  detail: PublicMeetingDetail;
  startHour: number;
  endHour: number;
  serverNowMs: number;
  today: string; // tanggal WIB (YYYY-MM-DD) dari server
};

const DATE_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
const HM_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function wibDate(ms: number): string {
  return DATE_FMT.format(new Date(ms));
}
function wibMinutes(ms: number): number {
  const [h, m] = HM_FMT.format(new Date(ms)).split(":").map(Number);
  return h * 60 + m;
}
function isoMinutes(iso: string): number {
  const [h, m] = HM_FMT.format(new Date(iso)).split(":").map(Number);
  return h * 60 + m;
}
function hh(min: number): string {
  return (
    String(Math.floor(min / 60)).padStart(2, "0") +
    "." +
    String(min % 60).padStart(2, "0")
  );
}
function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function longDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateStr}T00:00:00+07:00`));
}

export default function MeetingSchedule({
  hrisUrl,
  detail,
  startHour,
  endHour,
  serverNowMs,
  today,
}: Props) {
  const [date, setDate] = useState(today);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [nowMs, setNowMs] = useState(serverNowMs);

  // Jam "sekarang" diikat ke waktu server (bukan jam perangkat): server kirim
  // serverNowMs, klien hanya menambah waktu yang berlalu sejak render.
  useEffect(() => {
    const start = performance.now();
    const iv = setInterval(
      () => setNowMs(serverNowMs + (performance.now() - start)),
      60000
    );
    return () => clearInterval(iv);
  }, [serverNowMs]);

  const load = useCallback(
    async (d: string) => {
      setState("loading");
      try {
        const res = await fetch(`${hrisUrl}/api/public/meetings?date=${d}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        setRooms(Array.isArray(json.rooms) ? json.rooms : []);
        setBookings(Array.isArray(json.bookings) ? json.bookings : []);
        setState("ready");
      } catch {
        setRooms([]);
        setBookings([]);
        setState("error");
      }
    },
    [hrisUrl]
  );

  useEffect(() => {
    // Muat jadwal tiap tanggal berubah (sinkronisasi dgn sumber data HRIS).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(date);
  }, [date, load]);

  const base = startHour * 60;
  const span = (endHour - startHour) * 60;
  const cols = endHour - startHour;
  const nowDate = wibDate(nowMs);
  const nowMin = wibMinutes(nowMs);
  const isToday = date === nowDate;

  const minDate = shiftDate(today, -30);
  const maxDate = shiftDate(today, 30);

  const bookHref = `/login?callbackUrl=${encodeURIComponent(
    `${hrisUrl}/meeting-rooms`
  )}`;

  // Teks blok sesuai tingkat detail (tanpa nama pemesan).
  function blockContent(b: Booking) {
    const time = `${hh(isoMinutes(b.startAt))}–${hh(isoMinutes(b.endAt))}`;
    const div = b.department?.trim() || "";
    if (detail === "none") return { main: time, sub: "", tip: time };
    if (detail === "division")
      return {
        main: time,
        sub: div,
        tip: div ? `${time} · ${div}` : time,
      };
    // detail === "title"
    const title = b.title?.trim() || "Terisi";
    return {
      main: title,
      sub: div ? `${time} · ${div}` : time,
      tip: div ? `${title} · ${time} · ${div}` : `${title} · ${time}`,
    };
  }

  return (
    <section className="sec" id="jadwal">
      <div className="st">
        <p className="eb">Jadwal ruang meeting</p>
        <h2>Ruang rapat AsiaCommerce Surabaya</h2>
        <p>Lihat ruangan yang terisi dan yang masih tersedia.</p>
      </div>

      <div className="mc">
        <div className="tb">
          <button
            className="ib"
            onClick={() => setDate(shiftDate(date, -1))}
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
          <input
            className="in"
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Tanggal"
            style={{ width: 160 }}
          />
          <button
            className="ib"
            onClick={() => setDate(shiftDate(date, 1))}
            aria-label="Hari berikutnya"
          >
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>
          <button className="btn g s" onClick={() => setDate(today)}>
            Hari ini
          </button>
          <span className="dl">{longDate(date)}</span>
          <div className="lgd">
            <span>
              <i style={{ background: "var(--ok)" }} />
              Berlangsung
            </span>
            <span>
              <i style={{ background: "var(--warn)" }} />
              Dipesan
            </span>
            <span>
              <i style={{ background: "var(--line)" }} />
              Selesai
            </span>
          </div>
        </div>

        {state === "loading" ? (
          <div className="load">
            <span className="spin" />
          </div>
        ) : state === "error" ? (
          <div className="err">
            <span>Jadwal belum bisa dimuat. Coba lagi.</span>
            <button className="btn g s" onClick={() => load(date)}>
              <RotateCw size={15} strokeWidth={2.2} />
              Muat ulang
            </button>
          </div>
        ) : (
          <div className="tl">
            <div className="tg">
              {/* Baris header sumbu jam */}
              <div className="rw">
                <div className="lb">
                  <small style={{ margin: 0 }}>Ruangan</small>
                </div>
                <div className="hrs" style={{ ["--cols" as string]: cols }}>
                  {Array.from({ length: cols }, (_, i) => (
                    <span key={i}>{String(startHour + i).padStart(2, "0")}.00</span>
                  ))}
                </div>
              </div>

              {rooms.map((room) => {
                const list = bookings
                  .filter((b) => b.roomId === room.id)
                  .sort((a, b) => isoMinutes(a.startAt) - isoMinutes(b.startAt));
                const cur =
                  isToday &&
                  list.find(
                    (x) =>
                      nowMin >= isoMinutes(x.startAt) &&
                      nowMin < isoMinutes(x.endAt)
                  );
                const nxt =
                  isToday && list.find((x) => isoMinutes(x.startAt) > nowMin);

                let pill: { cls: string; text: string } | null = null;
                let sub = "";
                if (cur) {
                  pill = { cls: "u", text: "Dipakai" };
                  sub = "Terisi sampai " + hh(isoMinutes(cur.endAt));
                } else if (isToday) {
                  pill = { cls: "f", text: "Tersedia" };
                  sub = nxt
                    ? "Kosong sampai " + hh(isoMinutes(nxt.startAt))
                    : list.length
                      ? "Kosong sampai selesai"
                      : "Kosong seharian";
                } else {
                  pill = list.length ? null : { cls: "f", text: "Kosong" };
                  sub = `${list.length} jadwal`;
                }

                return (
                  <div className="rw" key={room.id}>
                    <div className="lb">
                      <b>
                        {room.name}
                        {pill && (
                          <span className={`pl ${pill.cls}`}>{pill.text}</span>
                        )}
                      </b>
                      <small>{sub}</small>
                    </div>
                    <div
                      className="tk"
                      onClick={() =>
                        toast(`Masuk dulu untuk memesan ${room.name}`, "info")
                      }
                      aria-label={`Jadwal ${room.name}`}
                    >
                      {list.length === 0 && (
                        <div className="em">Tersedia, belum ada jadwal</div>
                      )}
                      {list.map((b) => {
                        const s = isoMinutes(b.startAt);
                        const e = isoMinutes(b.endAt);
                        let left = ((s - base) / span) * 100;
                        let width = ((e - s) / span) * 100;
                        if (left < 0) {
                          width += left;
                          left = 0;
                        }
                        if (left + width > 100) width = 100 - left;
                        if (width < 0) width = 0;
                        // Klasifikasi berdasar waktu absolut (bukan hanya jam
                        // hari ini) agar meeting yang sudah lewat di tanggal mana
                        // pun — termasuk "auto check-in" (Dipesan tapi waktunya
                        // sudah lewat) — tampil sebagai "Selesai" (redup).
                        const startAbs = new Date(b.startAt).getTime();
                        const endAbs = new Date(b.endAt).getTime();
                        const live = nowMs >= startAbs && nowMs < endAbs;
                        const done = endAbs <= nowMs;
                        const cls = live ? "on" : done ? "done" : "pm";
                        const statusText = live
                          ? "Berlangsung"
                          : done
                            ? "Selesai"
                            : "Dipesan";
                        const c = blockContent(b);
                        const sub = [c.sub, statusText]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <div
                            key={b.id}
                            className={`ev ${cls}`}
                            style={{
                              left: `${left}%`,
                              width: `calc(${width}% - 3px)`,
                            }}
                            title={`${c.tip} · ${statusText}`}
                          >
                            <b>{c.main}</b>
                            <small>{sub}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Garis penanda waktu sekarang (hanya hari ini, dalam jam operasional) */}
              {isToday && nowMin >= base && nowMin <= endHour * 60 && (
                <div
                  className="nw"
                  style={{
                    left: `calc(var(--lw) + (100% - var(--lw)) * ${
                      (nowMin - base) / span
                    })`,
                  }}
                />
              )}
            </div>
          </div>
        )}

        <div className="nt">
          <Lock size={15} strokeWidth={2} />
          Nama pemesan dan detail agenda hanya terlihat setelah masuk.
          <span style={{ marginLeft: "auto" }}>
            <Link className="btn p s" href={bookHref}>
              Masuk untuk memesan ruangan
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
}
