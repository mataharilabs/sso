"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/callback";
import { createAndSendLoginOtp, type OtpRequestResult } from "@/lib/login-otp";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email atau password salah.";
        default:
          return "Gagal masuk. Coba lagi.";
      }
    }
    throw error;
  }
}

/** Minta kode OTP login (dikirim ke email & WhatsApp). */
export async function requestLoginOtp(email: string): Promise<OtpRequestResult> {
  return createAndSendLoginOtp(email);
}

/** Login memakai kode OTP. */
export async function authenticateOtp(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  try {
    await signIn("otp", {
      email: formData.get("email"),
      code: formData.get("code"),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Kode salah atau kadaluarsa.";
        default:
          return "Gagal masuk. Coba lagi.";
      }
    }
    throw error;
  }
}

export async function logoutEverywhere() {
  await signOut({ redirectTo: "/login" });
}
