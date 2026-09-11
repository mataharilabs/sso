// Data wilayah Indonesia dari dataset publik emsifa (JSON statis).
// https://github.com/emsifa/api-wilayah-indonesia
export type Region = { id: string; name: string };

const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export async function fetchProvinces(): Promise<Region[]> {
  try {
    const r = await fetch(`${BASE}/provinces.json`);
    if (!r.ok) return [];
    return (await r.json()) as Region[];
  } catch {
    return [];
  }
}

export async function fetchRegencies(provinceId: string): Promise<Region[]> {
  try {
    const r = await fetch(`${BASE}/regencies/${provinceId}.json`);
    if (!r.ok) return [];
    return (await r.json()) as Region[];
  } catch {
    return [];
  }
}
