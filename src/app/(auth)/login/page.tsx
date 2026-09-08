"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AlertCircle, LogIn } from "lucide-react";
import { authenticate } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <LogIn className="h-4 w-4" />
      {pending ? "Memproses..." : "Masuk"}
    </Button>
  );
}

function LoginForm() {
  const [errorMessage, formAction] = useActionState(authenticate, undefined);
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Masuk</h2>
        <p className="text-sm text-slate-500">
          Gunakan akun AsiaCommerce ID Anda.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@asiacommerce.net"
            required
            autoComplete="email"
          />
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
