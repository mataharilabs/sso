import { NextRequest, NextResponse } from "next/server";

/**
 * Autentikasi antar-service (mis. ASET → SSO) via header:
 *   Authorization: Bearer ${SERVICE_API_KEY}
 * SERVICE_API_KEY harus di-set sama di env SSO & app pemanggil.
 */
export function checkService(req: NextRequest): boolean {
  const key = process.env.SERVICE_API_KEY;
  if (!key) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${key}`;
}

export function serviceUnauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized service request" },
    { status: 401 }
  );
}
