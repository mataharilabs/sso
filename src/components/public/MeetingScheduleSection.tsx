"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

type Room = { id: string; name: string };
type Booking = {
  id: string;
  roomId: string;
  title: string;
  department: string | null;
  startAt: string;
  endAt: string;
  status: "BOOKED" | "CHECKED_IN";
  seriesId: string | null;
  employeeName: string;
};

function todayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date()
  );
}
function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function hhmm(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
function longDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateStr}T00:00:00+07:00`));
}

export function MeetingScheduleSection({ hrisUrl }: { hrisUrl: string }) {
  const [date, setDate] = useState(todayWIB());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (d: string) => {
      setLoading(true);
      try {
        const res = await fetch(`${hrisUrl}/api/public/meetings?date=${d}`, {
          cache: "no-store",
        });
        const json = await res.json();
        setRooms(json.rooms ?? []);
        setBookings(json.bookings ?? []);
      } catch {
        setRooms([]);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    },
    [hrisUrl]
  );

  useEffect(() => {
    load(date);
  }, [date, load]);

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
      <p className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
        Meeting Room Schedule
      </p>
      <h2 className="mb-5 text-center text-sm text-slate-500">
        Lihat jadwal &amp; status ruang rapat AsiaCommerce Surabaya
      </h2>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(shiftDate(date, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
            <button
              onClick={() => setDate(shiftDate(date, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-1 hidden text-sm text-slate-500 sm:inline">
              {longDate(date)}
            </span>
          </div>
          <a
            href={`${hrisUrl}/meeting-rooms`}
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Book Ruang Meeting
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const items = bookings.filter((b) => b.roomId === room.id);
              return (
                <div key={room.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-brand-600" />
                    <h3 className="font-semibold text-slate-800">{room.name}</h3>
                    <span className="ml-auto text-xs text-slate-400">
                      {items.length} jadwal
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-400">
                      Tersedia — belum ada jadwal.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-lg border border-slate-200 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-slate-800">
                                {hhmm(b.startAt)}–{hhmm(b.endAt)} · {b.title}
                                {b.seriesId && <span title="Berulang"> 🔁</span>}
                              </div>
                              <div className="text-xs text-slate-400">
                                {b.department ? `${b.department} · ` : ""}
                                {b.employeeName}
                              </div>
                            </div>
                            {b.status === "CHECKED_IN" ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                Check-in
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                Dipesan
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
