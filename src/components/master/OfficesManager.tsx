"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { COUNTRIES } from "@/lib/countries";
import { fetchProvinces, fetchRegencies, type Region } from "@/lib/region";

type Office = {
  id: string;
  name: string;
  country: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  isPrimary: boolean;
};

const empty = {
  name: "",
  country: "",
  province: "",
  city: "",
  address: "",
  isPrimary: false,
};

export function OfficesManager() {
  const [rows, setRows] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const isID = form.country === "Indonesia";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offices");
      setRows(await res.json());
    } catch {
      toast("Gagal memuat data kantor", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isID && provinces.length === 0) fetchProvinces().then(setProvinces);
  }, [isID, provinces.length]);

  useEffect(() => {
    if (!isID) {
      setRegencies([]);
      return;
    }
    const prov = provinces.find((p) => p.name === form.province);
    if (prov) fetchRegencies(prov.id).then(setRegencies);
    else setRegencies([]);
  }, [isID, form.province, provinces]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...empty });
    setOpen(true);
  }
  function openEdit(o: Office) {
    setEditingId(o.id);
    setForm({
      name: o.name,
      country: o.country ?? "",
      province: o.province ?? "",
      city: o.city ?? "",
      address: o.address ?? "",
      isPrimary: o.isPrimary,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast("Nama kantor wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/offices/${editingId}` : "/api/offices";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.issues?.[0]?.message ?? "Gagal");
      }
      toast(editingId ? "Kantor diperbarui" : "Kantor ditambahkan", "success");
      setOpen(false);
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus kantor ini?")) return;
    try {
      const res = await fetch(`/api/offices/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error ?? "Gagal");
      toast("Kantor dihapus", "success");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Kantor
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Belum ada data kantor.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kantor</TableHead>
                <TableHead>Kota</TableHead>
                <TableHead>Provinsi</TableHead>
                <TableHead>Negara</TableHead>
                <TableHead>Utama</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-slate-800">
                    {o.name}
                  </TableCell>
                  <TableCell className="text-sm">{o.city ?? "-"}</TableCell>
                  <TableCell className="text-sm">{o.province ?? "-"}</TableCell>
                  <TableCell className="text-sm">{o.country ?? "-"}</TableCell>
                  <TableCell>
                    {o.isPrimary && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Utama
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(o.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit Kantor" : "Tambah Kantor"}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Kantor *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Kantor Pusat Jakarta"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Negara</Label>
            <Select
              value={form.country}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  country: e.target.value,
                  province: "",
                  city: "",
                }))
              }
            >
              <option value="">- Pilih Negara -</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Provinsi</Label>
              {isID ? (
                <Select
                  value={form.province}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, province: e.target.value, city: "" }))
                  }
                >
                  <option value="">- Pilih Provinsi -</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={form.province}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, province: e.target.value }))
                  }
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Kota</Label>
              {isID ? (
                <Select
                  value={form.city}
                  disabled={!form.province}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, city: e.target.value }))
                  }
                >
                  <option value="">- Pilih Kota -</option>
                  {regencies.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Alamat</Label>
            <Textarea
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.isPrimary}
              onChange={(e) =>
                setForm((p) => ({ ...p, isPrimary: e.target.checked }))
              }
            />
            Kantor Utama
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
