"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageCircle,
  Mail,
  Loader2,
  Send,
  Link2,
  Unlink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

type Settings = {
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  emailFrom: string | null;
  whatsappConfigured: boolean;
  emailConfigured: boolean;
};
type WaStatus = { connected: boolean; phone: string | null; state: string };

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
        checked ? "bg-brand-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function NotificationSettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [wa, setWa] = useState<WaStatus | null>(null);
  const [saving, setSaving] = useState<"wa" | "email" | null>(null);
  const [testing, setTesting] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings/notifications");
    if (res.ok) setSettings(await res.json());
  }, []);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/settings/whatsapp/status");
    if (res.ok) setWa(await res.json());
  }, []);

  useEffect(() => {
    loadSettings();
    loadStatus();
  }, [loadSettings, loadStatus]);

  async function toggle(field: "whatsappEnabled" | "emailEnabled", value: boolean) {
    if (!settings) return;
    setSaving(field === "whatsappEnabled" ? "wa" : "email");
    setSettings({ ...settings, [field]: value });
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      toast("Setelan disimpan", "success");
    } catch {
      toast("Gagal menyimpan", "error");
      setSettings((s) => (s ? { ...s, [field]: !value } : s));
    } finally {
      setSaving(null);
    }
  }

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  async function openConnect() {
    setQr(null);
    setQrOpen(true);
    const tick = async () => {
      const res = await fetch("/api/settings/whatsapp/qr");
      if (!res.ok) return;
      const data = (await res.json()) as { connected: boolean; qr: string | null };
      if (data.connected) {
        stopPoll();
        setQrOpen(false);
        toast("WhatsApp tersambung", "success");
        loadStatus();
        return;
      }
      setQr(data.qr);
    };
    await tick();
    pollRef.current = setInterval(tick, 3000);
  }

  function closeConnect() {
    stopPoll();
    setQrOpen(false);
  }

  useEffect(() => () => stopPoll(), [stopPoll]);

  async function disconnect() {
    if (!confirm("Putuskan koneksi WhatsApp? Anda perlu scan ulang untuk menyambung.")) return;
    const res = await fetch("/api/settings/whatsapp/logout", { method: "POST" });
    if (res.ok) {
      toast("WhatsApp diputus", "success");
      loadStatus();
    } else {
      toast("Gagal memutus", "error");
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      const r = data.result ?? {};
      const parts: string[] = [];
      if (r.email) parts.push(`Email: ${r.email.sent ? "terkirim" : r.email.error}`);
      if (r.whatsapp) parts.push(`WA: ${r.whatsapp.sent ? "terkirim" : r.whatsapp.error}`);
      toast(parts.length ? parts.join(" · ") : "Tidak ada channel aktif/kontak", parts.length ? "info" : "error");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setTesting(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Notifikasi</h2>
        <p className="mb-4 text-sm text-slate-500">
          Aktifkan channel yang ingin dipakai untuk mengirim notifikasi &amp; OTP.
        </p>

        {/* WhatsApp */}
        <div className="flex items-center justify-between border-t border-slate-100 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-slate-800">Notifikasi WhatsApp</div>
              <div className="text-sm text-slate-500">
                {settings.whatsappConfigured
                  ? "Gateway terkonfigurasi."
                  : "Gateway belum diset (WA_GATEWAY_URL/KEY)."}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving === "wa" && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <Toggle
              checked={settings.whatsappEnabled}
              onChange={(v) => toggle("whatsappEnabled", v)}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between border-t border-slate-100 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-slate-800">Notifikasi Email</div>
              <div className="text-sm text-slate-500">
                {settings.emailConfigured
                  ? `Pengirim: ${settings.emailFrom ?? "-"}`
                  : "Email belum diset (RESEND_API_KEY)."}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving === "email" && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <Toggle
              checked={settings.emailEnabled}
              onChange={(v) => toggle("emailEnabled", v)}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={sendTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim uji ke akun saya
          </Button>
        </div>
      </Card>

      {/* Koneksi WhatsApp */}
      <Card className="p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Koneksi WhatsApp</h2>
        <p className="mb-4 text-sm text-slate-500">
          Sambungkan nomor WhatsApp admin yang akan mengirim notifikasi/OTP.
        </p>

        {!settings.whatsappConfigured ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Gateway belum dikonfigurasi. Set <code>WA_GATEWAY_URL</code> &amp;{" "}
            <code>WA_GATEWAY_KEY</code> di environment SSO.
          </div>
        ) : wa?.connected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>
                Tersambung sebagai{" "}
                <strong className="text-slate-800">+{wa.phone}</strong>
              </span>
            </div>
            <Button variant="outline" onClick={disconnect}>
              <Unlink className="h-4 w-4" />
              Putuskan
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Belum tersambung.</div>
            <Button onClick={openConnect}>
              <Link2 className="h-4 w-4" />
              Sambungkan
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={qrOpen} onClose={closeConnect} title="Sambungkan WhatsApp">
        <div className="text-center">
          <p className="mb-4 text-sm text-slate-500">
            Buka WhatsApp di HP admin → <strong>Perangkat Tertaut</strong> →{" "}
            <strong>Tautkan Perangkat</strong>, lalu scan QR di bawah.
          </p>
          <div className="flex min-h-[300px] items-center justify-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR WhatsApp" className="h-72 w-72" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            )}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Menunggu pemindaian… jendela ini menutup otomatis saat tersambung.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
