import { requireUser, AuthError } from "@/lib/session";
import { fetchAgenda } from "@/lib/agenda";
import { handleApiError } from "@/lib/api";

// Ringkasan agenda pengguna yang sedang login (dipakai panel "Agenda Anda").
// Kegagalan HRIS tidak mematikan halaman: panel menampilkan pesan kecil,
// bagian lain tetap berfungsi.
export async function GET() {
  try {
    const user = await requireUser();
    const items = await fetchAgenda(user.id);
    return Response.json({ items });
  } catch (error) {
    if (error instanceof AuthError) return handleApiError(error);
    console.error("[AGENDA]", error);
    return Response.json({ error: "Agenda gagal dimuat" }, { status: 502 });
  }
}
