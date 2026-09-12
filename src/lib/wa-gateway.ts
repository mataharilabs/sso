// Klien server-side ke layanan wa-gateway (Baileys). Key rahasia hanya di server.
const URL = process.env.WA_GATEWAY_URL ?? "";
const KEY = process.env.WA_GATEWAY_KEY ?? "";

export function waConfigured(): boolean {
  return Boolean(URL && KEY);
}

async function gw(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export type WaStatus = {
  connected: boolean;
  phone: string | null;
  state: string;
};

export async function waStatus(): Promise<WaStatus> {
  if (!waConfigured()) return { connected: false, phone: null, state: "unconfigured" };
  try {
    const res = await gw("/status");
    if (!res.ok) return { connected: false, phone: null, state: "error" };
    return (await res.json()) as WaStatus;
  } catch {
    return { connected: false, phone: null, state: "offline" };
  }
}

export async function waQr(): Promise<{ connected: boolean; qr: string | null }> {
  if (!waConfigured()) return { connected: false, qr: null };
  try {
    const res = await gw("/qr");
    if (!res.ok) return { connected: false, qr: null };
    return (await res.json()) as { connected: boolean; qr: string | null };
  } catch {
    return { connected: false, qr: null };
  }
}

export async function waLogout(): Promise<boolean> {
  if (!waConfigured()) return false;
  try {
    const res = await gw("/logout", { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Kirim pesan teks WA. Throw bila gagal. */
export async function waSend(to: string, message: string): Promise<void> {
  if (!waConfigured()) throw new Error("Gateway WhatsApp belum dikonfigurasi");
  const res = await gw("/send", {
    method: "POST",
    body: JSON.stringify({ to, message }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Gagal mengirim WhatsApp");
  }
}
