"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { logoutEverywhere } from "@/lib/actions/auth";

export default function LogoutPage() {
  useEffect(() => {
    logoutEverywhere();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Keluar...
      </div>
    </div>
  );
}
