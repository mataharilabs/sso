"use client";

import { Suspense, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, LogIn, ArrowLeft } from "lucide-react";
import { authenticate } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const EMAIL_DOMAINS = ["asiacommerce.net", "asiacommerce.id"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <LogIn className="h-4 w-4" />
      {pending ? "Memproses..." : "Masuk"}
    </Button>
  );
}

function Form() {
  const [errorMessage, formAction] = useActionState(authenticate, undefined);
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";

  const [local, setLocal] = useState("");
  const [domain, setDomain] = useState(EMAIL_DOMAINS[0]);

  // Bila user mengetik alamat email lengkap (mengandung "@"), pakai apa adanya.
  const fullEmail = local.includes("@") ? local.trim() : `${local.trim()}@${domain}`;

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
          Gunakan akun AsiaCommerce ID Anda.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <input type="hidden" name="email" value={fullEmail} />

        <div className="space-y-1.5">
          <Label htmlFor="local">Email</Label>
          <div className="flex gap-2">
            <Input
              id="local"
              type="text"
              placeholder="nama"
              required
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
          <p className="text-xs text-slate-400">
            Cukup ketik nama depan email, lalu pilih domain kantor.
          </p>
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

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        <SubmitButton />
      </form>
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
