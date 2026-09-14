"use client";

import { Suspense, useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, LogIn, ArrowLeft, KeyRound, Send } from "lucide-react";
import {
  authenticate,
  authenticateOtp,
  requestLoginOtp,
} from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const EMAIL_DOMAINS = ["asiacommerce.net", "asiacommerce.id"];

// Kode negara — Indonesia paling atas.
const DIAL_CODES = [
  { code: "62", label: "🇮🇩 +62" },
  { code: "60", label: "🇲🇾 +60" },
  { code: "65", label: "🇸🇬 +65" },
  { code: "63", label: "🇵🇭 +63" },
  { code: "66", label: "🇹🇭 +66" },
  { code: "84", label: "🇻🇳 +84" },
  { code: "91", label: "🇮🇳 +91" },
  { code: "86", label: "🇨🇳 +86" },
  { code: "81", label: "🇯🇵 +81" },
  { code: "82", label: "🇰🇷 +82" },
  { code: "61", label: "🇦🇺 +61" },
  { code: "1", label: "🇺🇸 +1" },
  { code: "44", label: "🇬🇧 +44" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <LogIn className="h-4 w-4" />
      {pending ? "Memproses..." : label}
    </Button>
  );
}

function Form() {
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";
  const [mode, setMode] = useState<"otp" | "password">("otp");

  // ---- OTP mode ----
  const [rawId, setRawId] = useState("");
  const [dial, setDial] = useState("62");
  const isPhone = /^[+0-9]/.test(rawId.trim()) && rawId.trim() !== "";

  // Bangun identifier final (email apa adanya, atau nomor E.164 tanpa "+").
  function buildIdentifier(): string {
    if (!isPhone) return rawId.trim();
    let digits = rawId.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.startsWith(dial)) digits = digits.slice(dial.length);
    return `${dial}${digits}`;
  }

  const [otpStep, setOtpStep] = useState<"id" | "code">("id");
  const [otpError, otpAction] = useActionState(authenticateOtp, undefined);
  const [reqError, setReqError] = useState<string | null>(null);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  // ---- Password mode ----
  const [pwError, pwAction] = useActionState(authenticate, undefined);
  const [local, setLocal] = useState("");
  const [domain, setDomain] = useState(EMAIL_DOMAINS[0]);
  const pwEmail = local.includes("@") ? local.trim() : `${local.trim()}@${domain}`;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function sendCode(id: string, goNext: boolean) {
    if (!id) {
      setReqError("Masukkan nomor WhatsApp atau email");
      return;
    }
    setReqError(null);
    startTransition(async () => {
      const res = await requestLoginOtp(id);
      if (!res.ok) {
        setReqError(res.error ?? "Gagal mengirim kode");
        return;
      }
      const via = res.channel === "whatsapp" ? "WhatsApp" : "email";
      setSentInfo(`Kode dikirim via ${via}${res.dest ? ` ke ${res.dest}` : ""}`);
      setCooldown(60);
      if (goNext) setOtpStep("code");
    });
  }

  function submitId() {
    const id = buildIdentifier();
    setIdentifier(id);
    sendCode(id, true);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">Masuk</h2>
        <p className="text-sm text-slate-500">
          {mode === "otp"
            ? "Masukkan Nomor WhatsApp atau alamat email yang terdaftar di kantor."
            : "Masuk dengan email & sandi."}
        </p>
      </div>

      {mode === "otp" ? (
        otpStep === "id" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rawId">Nomor WhatsApp / Email</Label>
              <div className="flex gap-2">
                {isPhone && (
                  <Select
                    value={dial}
                    onChange={(e) => setDial(e.target.value)}
                    className="w-auto"
                    aria-label="Kode negara"
                  >
                    {DIAL_CODES.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                )}
                <Input
                  id="rawId"
                  type="text"
                  inputMode="text"
                  placeholder="Nomor Whatsapp atau alamat email"
                  value={rawId}
                  onChange={(e) => setRawId(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitId();
                    }
                  }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {isPhone
                  ? "Terdeteksi nomor — kode dikirim via WhatsApp."
                  : "Ketik angka untuk pakai nomor WhatsApp, atau ketik email."}
              </p>
            </div>
            {reqError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {reqError}
              </div>
            )}
            <Button
              size="lg"
              className="w-full"
              onClick={submitId}
              disabled={pending}
            >
              <Send className="h-4 w-4" />
              {pending ? "Mengirim..." : "Kirim Kode"}
            </Button>
          </div>
        ) : (
          <form action={otpAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input type="hidden" name="identifier" value={identifier} />
            {sentInfo && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {sentInfo}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="code">Kode Masuk</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                maxLength={6}
                placeholder="6 digit"
                autoComplete="one-time-code"
                className="tracking-[0.5em] text-center text-lg"
                required
              />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("id");
                    setSentInfo(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Ganti nomor/email
                </button>
                <button
                  type="button"
                  onClick={() => sendCode(identifier, false)}
                  disabled={cooldown > 0 || pending}
                  className="font-medium text-brand-700 disabled:text-slate-400"
                >
                  {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang kode"}
                </button>
              </div>
            </div>
            {otpError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {otpError}
              </div>
            )}
            <SubmitButton label="Masuk" />
          </form>
        )
      ) : (
        <form action={pwAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <input type="hidden" name="email" value={pwEmail} />
          <div className="space-y-1.5">
            <Label htmlFor="local">Email</Label>
            <div className="flex gap-2">
              <Input
                id="local"
                type="text"
                placeholder="nama"
                autoComplete="username"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="flex-1"
              />
              {!local.includes("@") && (
                <Select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-auto"
                  aria-label="Domain email"
                >
                  {EMAIL_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      @{d}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          {pwError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {pwError}
            </div>
          )}
          <SubmitButton label="Masuk" />
        </form>
      )}

      <div className="border-t border-slate-100 pt-4 text-center">
        {mode === "otp" ? (
          <button
            type="button"
            onClick={() => setMode("password")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            <KeyRound className="h-4 w-4" />
            Login dengan Sandi
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setOtpStep("id");
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            <Send className="h-4 w-4" />
            Login dengan Kode OTP
          </button>
        )}
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
