// Ringkasan "Agenda Anda" untuk launchpad SSO — data berasal dari HRIS.
//
// Kontrak endpoint HRIS (yang perlu disediakan HRIS):
//   GET {HRIS_URL}/api/service/agenda?userId={id}
//   Header: Authorization: Bearer {SERVICE_API_KEY}
//   Response: { items: RawAgendaItem[] }
//
//   RawAgendaItem = {
//     type: "leave_pending" | "leave_next" | "meeting_today" | "meeting_upcoming",
//     title: string,          // judul singkat
//     detail: string,         // keterangan siap-tampil (HRIS hitung "N hari lagi"
//                             //  dengan TZ Asia/Jakarta agar konsisten)
//     href?: string,          // path relatif di HRIS (mis. "/leave"); opsional
//   }
//
// SSO hanya menormalkan: menentukan label/kicker, warna, urutan, href absolut,
// dan membatasi jumlah item. Bila HRIS belum menyediakan endpoint ini (atau
// SERVICE_API_KEY belum diset), agenda dianggap kosong tanpa mematikan halaman.

export type AgendaType =
  | "leave_pending"
  | "leave_next"
  | "meeting_today"
  | "meeting_upcoming";

export type AgendaTone = "warn" | "brand" | "ok";

// Item siap-tampil yang dikirim ke klien.
export type AgendaItem = {
  id: string;
  type: AgendaType;
  kicker: string; // label kecil berwarna
  title: string;
  detail: string;
  href: string; // absolut ke HRIS
  tone: AgendaTone;
};

const ORDER: Record<AgendaType, number> = {
  leave_pending: 0,
  leave_next: 1,
  meeting_today: 2,
  meeting_upcoming: 3,
};

const KICKER: Record<AgendaType, string> = {
  leave_pending: "Menunggu persetujuan",
  leave_next: "Cuti berikutnya",
  meeting_today: "Meeting hari ini",
  meeting_upcoming: "Meeting mendatang",
};

const TONE: Record<AgendaType, AgendaTone> = {
  leave_pending: "warn",
  leave_next: "brand",
  meeting_today: "ok",
  meeting_upcoming: "ok",
};

const DEFAULT_PATH: Record<AgendaType, string> = {
  leave_pending: "/leave",
  leave_next: "/leave",
  meeting_today: "/meeting-rooms",
  meeting_upcoming: "/meeting-rooms",
};

const MAX_ITEMS = 5;

function isAgendaType(v: unknown): v is AgendaType {
  return typeof v === "string" && v in ORDER;
}

function hrisBase(): string {
  return (process.env.HRIS_URL ?? "https://hris.asiacommerce.net").replace(
    /\/+$/,
    ""
  );
}

function resolveHref(base: string, type: AgendaType, path?: unknown): string {
  const p = typeof path === "string" && path.startsWith("/") ? path : DEFAULT_PATH[type];
  return `${base}${p}`;
}

/**
 * Ambil ringkasan agenda pengguna dari HRIS.
 * Melempar error bila HRIS gagal dihubungi (biar route bisa menandai panel
 * sebagai "gagal dimuat"). Mengembalikan [] bila belum dikonfigurasi.
 */
export async function fetchAgenda(userId: string): Promise<AgendaItem[]> {
  const key = process.env.SERVICE_API_KEY;
  if (!key) return []; // belum dikonfigurasi → agenda kosong, bukan error

  const base = hrisBase();
  const res = await fetch(
    `${base}/api/service/agenda?userId=${encodeURIComponent(userId)}`,
    {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    }
  );
  if (!res.ok) throw new Error(`HRIS agenda HTTP ${res.status}`);

  const data: unknown = await res.json();
  const raw = Array.isArray((data as { items?: unknown })?.items)
    ? ((data as { items: unknown[] }).items as Record<string, unknown>[])
    : [];

  const items: AgendaItem[] = raw
    .filter((it) => isAgendaType(it?.type))
    .map((it, i) => {
      const type = it.type as AgendaType;
      return {
        id: `${type}-${i}`,
        type,
        kicker: KICKER[type],
        title: String(it.title ?? ""),
        detail: String(it.detail ?? ""),
        href: resolveHref(base, type, it.href),
        tone: TONE[type],
      };
    });

  // Urutan: menunggu persetujuan → cuti berikutnya → meeting hari ini →
  // meeting mendatang. Dalam tipe yang sama, pertahankan urutan dari HRIS.
  items.sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  return items.slice(0, MAX_ITEMS);
}
