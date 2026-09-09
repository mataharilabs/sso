import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { safeCallbackUrl } from "@/lib/callback";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  // Sudah login → langsung teruskan ke app asal (callbackUrl) atau launchpad.
  const user = await getCurrentUser();
  if (user) {
    const target = callbackUrl ? safeCallbackUrl(callbackUrl) : "/dash";
    redirect(target === "/" ? "/dash" : target);
  }

  return <LoginForm />;
}
