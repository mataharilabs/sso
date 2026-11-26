"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  MessageCircle,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  ArrowUp,
  Info,
} from "lucide-react";
import {
  authenticate,
  authenticateOtp,
  requestLoginOtp,
} from "@/lib/actions/auth";

// Domain email kantor untuk pilihan cepat (konfigurasi, mudah diubah).
const EMAIL_DOMAINS = ["asiacommerce.net", "asiacommerce.id"];
const EMRE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DEF =
  "Kode OTP dikirim lewat WhatsApp. Ingin masuk dengan email? Gunakan tab Sandi.";
// Cooldown kirim ulang mengikuti kebijakan server (COOLDOWN_MS = 60 dtk).
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 3;

const digitsOnly = (s: string) => s.replace(/\D/g, "");
// Normalisasi ke bentuk 8xx (buang 62 / 0 di depan).
function normPhone(s: string): string {
  let d = digitsOnly(s);
  if (d.startsWith("62")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return d;
}
const fmtP = (d: string) =>
  "+62 " + d.slice(0, 3) + "-" + d.slice(3, 7) + (d.length > 7 ? "-" + d.slice(7) : "");
const looksEmail = (v: string) => /[A-Za-z@]/.test(v);
const validPhone = (d: string) => d.length >= 9 && d.length <= 12 && d[0] === "8";

type Mode = "otp" | "pw";
type OtpStep = "id" | "code";
type Help = { text: string; cls: "" | "ok" | "er" };
type FieldErr = { on: boolean; text: string };

export default function LoginPanel({ callbackUrl }: { callbackUrl: string }) {
  const [mode, setMode] = useState<Mode>("otp");

  // ---- OTP ----
  const [otpStep, setOtpStep] = useState<OtpStep>("id");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState(false);
  const [phoneHelp, setPhoneHelp] = useState<Help>({ text: DEF, cls: "" });
  const [sending, setSending] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [codeBad, setCodeBad] = useState(false);
  const [codeMsg, setCodeMsg] = useState<Help>({ text: "", cls: "" });
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpPending, startOtp] = useTransition();

  // ---- Sandi ----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [emailErr, setEmailErr] = useState<FieldErr>({ on: false, text: "" });
  const [pwErr, setPwErr] = useState<FieldErr>({ on: false, text: "" });
  const [pwPending, startPw] = useTransition();
  const [autoNote, setAutoNote] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fokus awal ke kolom nomor.
  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  // Hitung mundur kirim ulang.
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  function switchTab(m: Mode) {
    setMode(m);
    setAutoNote(false);
    setTimeout(() => (m === "otp" ? phoneRef : emailRef).current?.focus(), 0);
  }

  // ---------- OTP: langkah nomor ----------
  function onPhoneChange(v: string) {
    if (looksEmail(v)) {
      toEmail(v);
      return;
    }
    setPhone(v);
    setPhoneErr(false);
    const d = normPhone(v);
    if (!v.trim()) setPhoneHelp({ text: DEF, cls: "" });
    else if (validPhone(d))
      setPhoneHelp({
        text: "Kode OTP dikirim lewat WhatsApp ke " + fmtP(d),
        cls: "ok",
      });
    else
      setPhoneHelp({
        text: "Nomor WhatsApp biasanya diawali 08 dan 10–13 digit.",
        cls: "",
      });
  }

  // Ketik email di kolom OTP → pindah otomatis ke tab Sandi, bawa isian.
  function toEmail(v: string) {
    setPhone("");
    setPhoneHelp({ text: DEF, cls: "" });
    setPhoneErr(false);
    setMode("pw");
    setEmail(v);
    setAutoNote(true);
    setTimeout(() => {
      const el = emailRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(v.length, v.length);
      }
    }, 0);
  }

  async function sendCode() {
    const v = phone.trim();
    const d = normPhone(v);
    if (!validPhone(d)) {
      setPhoneErr(true);
      setPhoneHelp({
        text: v
          ? "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890."
          : "Isi nomor WhatsApp Anda.",
        cls: "er",
      });
      phoneRef.current?.focus();
      return;
    }
    const id = "62" + d;
    setSending(true);
    const res = await requestLoginOtp(id);
    setSending(false);
    if (!res.ok) {
      setPhoneErr(true);
      setPhoneHelp({ text: res.error ?? "Gagal mengirim kode.", cls: "er" });
      phoneRef.current?.focus();
      return;
    }
    setIdentifier(id);
    setMaskedTarget("+62 ••• •••• " + d.slice(-4));
    setAttemptsLeft(MAX_ATTEMPTS);
    setLocked(false);
    setCode(["", "", "", "", "", ""]);
    setCodeBad(false);
    setCodeMsg({ text: "", cls: "" });
    setOtpStep("code");
    setCountdown(RESEND_SECONDS);
    setTimeout(() => boxRefs.current[0]?.focus(), 0);
  }

  async function resend() {
    const id = identifier || "62" + normPhone(phone);
    const res = await requestLoginOtp(id);
    if (!res.ok) {
      setCodeMsg({ text: res.error ?? "Gagal mengirim ulang kode.", cls: "er" });
      return;
    }
    setCode(["", "", "", "", "", ""]);
    setCodeBad(false);
    setAttemptsLeft(MAX_ATTEMPTS);
    setLocked(false);
    setCodeMsg({ text: "Kode baru telah dikirim.", cls: "ok" });
    setCountdown(RESEND_SECONDS);
    setTimeout(() => boxRefs.current[0]?.focus(), 0);
  }

  function changeNumber() {
    setCountdown(0);
    setOtpStep("id");
    setTimeout(() => phoneRef.current?.focus(), 0);
  }

  // ---------- OTP: kotak kode ----------
  function scheduleVerify(arr: string[]) {
    if (locked || otpPending) return;
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    verifyTimer.current = setTimeout(() => verify(arr), 180);
  }

  function setDigit(i: number, val: string) {
    const d = digitsOnly(val).slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    setCodeBad(false);
    setCodeMsg({ text: "", cls: "" });
    if (d && boxRefs.current[i + 1]) boxRefs.current[i + 1]?.focus();
    if (next.every((x) => x)) scheduleVerify(next);
  }

  function onBoxKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[i] && boxRefs.current[i - 1]) {
      e.preventDefault();
      const prev = [...code];
      prev[i - 1] = "";
      setCode(prev);
      boxRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && boxRefs.current[i - 1]) {
      boxRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && boxRefs.current[i + 1]) {
      boxRefs.current[i + 1]?.focus();
    } else if (e.key === "Enter") {
      verify(code);
    }
  }

  function onBoxPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const t = digitsOnly(e.clipboardData.getData("text")).slice(0, 6);
    if (!t) return;
    const next = ["", "", "", "", "", ""];
    [...t].forEach((c, k) => (next[k] = c));
    setCode(next);
    boxRefs.current[Math.min(t.length, 5)]?.focus();
    if (t.length === 6) scheduleVerify(next);
  }

  function verify(arr?: string[]) {
    const c = (arr ?? code).join("");
    if (c.length < 6) {
      setCodeMsg({ text: "Lengkapi 6 digit kode.", cls: "er" });
      return;
    }
    if (locked || otpPending) return;
    const fd = new FormData();
    fd.set("identifier", identifier);
    fd.set("code", c);
    fd.set("callbackUrl", callbackUrl);
    startOtp(async () => {
      // Sukses → server redirect (ditangani di dalam transition).
      const err = await authenticateOtp(undefined, fd);
      if (err) handleWrong();
    });
  }

  function handleWrong() {
    const left = attemptsLeft - 1;
    setAttemptsLeft(left);
    setCodeBad(true);
    if (left <= 0) {
      setLocked(true);
      setCodeMsg({
        text: "Terlalu banyak percobaan. Coba lagi dalam 5 menit.",
        cls: "er",
      });
      return;
    }
    setCodeMsg({ text: "Kode salah. Sisa percobaan: " + left, cls: "er" });
    setTimeout(() => {
      setCode(["", "", "", "", "", ""]);
      setCodeBad(false);
      boxRefs.current[0]?.focus();
    }, 420);
  }

  // ---------- Sandi ----------
  const domainChips = (() => {
    const i = email.indexOf("@");
    if (i < 1 || email.indexOf("@", i + 1) > -1) return [];
    const typed = email.slice(i + 1).toLowerCase();
    return EMAIL_DOMAINS.filter((d) => d.startsWith(typed) && d !== typed);
  })();

  function onEmailChange(v: string) {
    setEmailErr({ on: false, text: "" });
    setAutoNote(false);
    // Jika kolom email diisi nomor telepon → pindah ke tab Kode OTP.
    if (/^[\d\s+()-]{8,}$/.test(v) && normPhone(v).length >= 8) {
      setEmail("");
      setMode("otp");
      onPhoneChange(v);
      setTimeout(() => phoneRef.current?.focus(), 0);
      return;
    }
    setEmail(v);
  }

  function pickDomain(d: string) {
    const i = email.indexOf("@");
    const local = i >= 0 ? email.slice(0, i) : email;
    setEmail(local + "@" + d);
    setTimeout(() => pwRef.current?.focus(), 0);
  }

  function submitPw(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim();
    const emBad = !EMRE.test(em);
    const pwBad = !password;
    setEmailErr(
      emBad ? { on: true, text: "Masukkan alamat email yang valid." } : { on: false, text: "" }
    );
    setPwErr(pwBad ? { on: true, text: "Sandi wajib diisi." } : { on: false, text: "" });
    if (emBad || pwBad) {
      (emBad ? emailRef : pwRef).current?.focus();
      return;
    }
    const fd = new FormData();
    fd.set("email", em);
    fd.set("password", password);
    fd.set("callbackUrl", callbackUrl);
    startPw(async () => {
      const err = await authenticate(undefined, fd);
      if (err) {
        setPwErr({ on: true, text: err });
        pwRef.current?.focus();
      }
    });
  }

  const showHeader = mode === "pw" || otpStep === "id";

  return (
    <main className="pn">
      <Link className="bk" href="/">
        <ArrowLeft size={17} strokeWidth={2.2} />
        Kembali ke Beranda
      </Link>

      <div className="bx">
        {showHeader && (
          <div>
            <h2>Masuk</h2>
            <p className="sub">Pilih cara masuk dengan akun kantor Anda.</p>
            <div className="seg" role="tablist" aria-label="Cara masuk">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "otp"}
                className={mode === "otp" ? "on" : ""}
                onClick={() => switchTab("otp")}
              >
                <MessageCircle size={17} strokeWidth={2} />
                Kode OTP
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "pw"}
                className={mode === "pw" ? "on" : ""}
                onClick={() => switchTab("pw")}
              >
                <KeyRound size={17} strokeWidth={2} />
                Sandi
              </button>
            </div>
          </div>
        )}

        {/* OTP — langkah nomor */}
        {mode === "otp" && otpStep === "id" && (
          <div className="v">
            <div className={`f ${phoneErr ? "err" : ""}`}>
              <label className="l" htmlFor="phone">
                Nomor WhatsApp
              </label>
              <div className="iw">
                <span className="pf">🇮🇩 +62</span>
                <input
                  className="in pl"
                  id="phone"
                  ref={phoneRef}
                  value={phone}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0812 3456 7890"
                  onChange={(e) => onPhoneChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendCode();
                    }
                  }}
                />
              </div>
              <div className={`hp ${phoneHelp.cls}`}>{phoneHelp.text}</div>
            </div>
            <button className="btn" onClick={sendCode} disabled={sending}>
              {sending ? (
                <>
                  <span className="sp" />
                  Mengirim…
                </>
              ) : (
                "Kirim kode"
              )}
            </button>
          </div>
        )}

        {/* OTP — langkah kode */}
        {mode === "otp" && otpStep === "code" && (
          <div className="v">
            <h2>Masukkan kode</h2>
            <p className="sub">
              Kami mengirim kode 6 digit lewat WhatsApp ke <b>{maskedTarget}</b>.
            </p>
            <div className={`otp ${codeBad ? "bad" : ""}`} aria-label="Kode 6 digit">
              {code.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxRefs.current[i] = el;
                  }}
                  className={d ? "fl" : ""}
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  value={d}
                  disabled={locked}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onBoxKeyDown(i, e)}
                  onPaste={i === 0 ? onBoxPaste : undefined}
                />
              ))}
            </div>
            <div className={`hp ${codeMsg.cls}`} style={{ textAlign: "center" }}>
              {codeMsg.text}
            </div>
            <div className="tg">
              <span>
                {countdown > 0 ? (
                  <>
                    Kirim ulang kode dalam <b>{countdown} dtk</b>
                  </>
                ) : (
                  <button type="button" className="ln" onClick={resend}>
                    Kirim ulang kode
                  </button>
                )}
              </span>
              <button type="button" className="ln" onClick={changeNumber}>
                Ganti nomor
              </button>
            </div>
            <button
              className="btn"
              onClick={() => verify()}
              disabled={locked || otpPending}
            >
              {otpPending ? (
                <>
                  <span className="sp" />
                  Memverifikasi…
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </div>
        )}

        {/* Sandi */}
        {mode === "pw" && (
          <div className="v">
            {autoNote && (
              <div className="nt" role="status">
                <Info size={18} strokeWidth={2} />
                <span>
                  Kode OTP hanya dikirim lewat WhatsApp. Untuk login dengan
                  email, kami pindahkan Anda ke tab <b>Sandi</b>.
                </span>
              </div>
            )}
            <form onSubmit={submitPw} noValidate>
              <div className={`f ${emailErr.on ? "err" : ""}`}>
                <label className="l" htmlFor="email">
                  Email
                </label>
                <input
                  className="in"
                  id="email"
                  ref={emailRef}
                  type="text"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  placeholder="nama@asiacommerce.net"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                />
                {domainChips.length > 0 && (
                  <div className="dom" role="group" aria-label="Pilih domain email">
                    <span className="dl">Pilih cepat:</span>
                    {domainChips.map((d) => (
                      <button type="button" key={d} onClick={() => pickDomain(d)}>
                        @{d}
                      </button>
                    ))}
                  </div>
                )}
                <div className={`hp ${emailErr.on ? "er" : ""}`}>{emailErr.text}</div>
              </div>

              <div className={`f ${pwErr.on ? "err" : ""}`}>
                <label className="l" htmlFor="pw">
                  Sandi
                </label>
                <div className="iw">
                  <input
                    className="in pr"
                    id="pw"
                    ref={pwRef}
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan sandi"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPwErr({ on: false, text: "" });
                    }}
                    onKeyUp={(e) =>
                      setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))
                    }
                    onBlur={() => setCapsOn(false)}
                  />
                  <button
                    className="eye"
                    type="button"
                    aria-label={showPw ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    aria-pressed={showPw}
                    onClick={() => setShowPw((s) => !s)}
                  >
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className={`wr ${capsOn ? "on" : ""}`}>
                  <ArrowUp size={16} strokeWidth={2.2} />
                  Caps Lock aktif
                </div>
                <div className={`hp ${pwErr.on ? "er" : ""}`}>{pwErr.text}</div>
              </div>

              <button className="btn" type="submit" disabled={pwPending}>
                {pwPending ? (
                  <>
                    <span className="sp" />
                    Memeriksa…
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>
        )}

        <div className="ft">
          Belum punya akun atau tidak bisa masuk? Hubungi <b>HR Admin</b>.
        </div>
      </div>

      <div className="cp">© AsiaCommerce · Dilindungi enkripsi</div>
    </main>
  );
}
