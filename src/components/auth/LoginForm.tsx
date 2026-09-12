"use client";

import {
  Suspense,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <LogIn className="h-4 w-4" />
      {pending ? "Memproses..." : label}
    </Button>
  );
}

function EmailField({
  local,
  setLocal,
  domain,
  setDomain,
}: {
  local: string;
  setLocal: (v: string) => void;
  domain: string;
  setDomain: (v: string) => void;
}) {
  return (
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
  );
}

function Form() {
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";
  const [mode, setMode] = useState<"otp" | "password">("otp");

  const [local, setLocal] = useState("");
  const [domain, setDomain] = useState(EMAIL_DOMAINS[0]);
  const fullEmail = local.includes("@") ? local.trim() : `${local.trim()}@${domain}`;

  // Password mode
  const [pwError, pwAction] = useActionState(authenticate, undefined);

  // OTP mode
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpError, otpAction] = useActionState(authenticateOtp, undefined);
  const [reqError, setReqError] = useState<string | null>(null);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function sendCode(goNext: boolean) {
    if (!local.trim()) {
      setReqError("Isi email terlebih dahulu");
      return;
    }
    setReqError(null);
    startTransition(async () => {
      const res = await requestLoginOtp(fullEmail);
      if (!res.ok) {
        setReqError(res.error ?? "Gagal mengirim kode");
        return;
      }
      const ch = [res.channels?.email && "email", res.channels?.whatsapp && "WhatsApp"]
        .filter(Boolean)
        .join(" & ");
      setSentInfo(`Kode dikirim via ${ch} ke ${fullEmail}`);
      setCooldown(60);
      if (goNext) setOtpStep("code");
    });
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
            ? "Masukkan email, kami kirim kode masuk ke email & WhatsApp Anda."
            : "Masuk dengan email & sandi."}
        </p>
      </div>

      {mode === "otp" ? (
        otpStep === "email" ? (
          <div className="space-y-4">
            <EmailField
              local={local}
              setLocal={setLocal}
              domain={domain}
              setDomain={setDomain}
            />
            {reqError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {reqError}
              </div>
            )}
            <Button
              size="lg"
              className="w-full"
              onClick={() => sendCode(true)}
              disabled={pending}
            >
              <Send className="h-4 w-4" />
              {pending ? "Mengirim..." : "Kirim Kode"}
            </Button>
          </div>
        ) : (
          <form action={otpAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input type="hidden" name="email" value={fullEmail} />
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
                    setOtpStep("email");
                    setSentInfo(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Ganti email
                </button>
                <button
                  type="button"
                  onClick={() => sendCode(false)}
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
          <input type="hidden" name="email" value={fullEmail} />
          <EmailField
            local={local}
            setLocal={setLocal}
            domain={domain}
            setDomain={setDomain}
          />
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
              setOtpStep("email");
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
