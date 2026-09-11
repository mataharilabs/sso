"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export type ColumnDef = {
  key: string;
  label: string;
  map?: Record<string, string>;
};

type Row = Record<string, unknown> & { id: string };

function resolve(row: Record<string, unknown>, key: string): string {
  const val = key.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object")
      return (acc as Record<string, unknown>)[k];
    return undefined;
  }, row);
  if (typeof val === "boolean") return val ? "Ya" : "Tidak";
  return val == null ? "-" : String(val);
}

export function MasterManager({
  endpoint,
  fields,
  columns,
  entityLabel,
}: {
  endpoint: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  entityLabel: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error();
      setRows(await res.json());
    } catch {
      toast(`Gagal memuat ${entityLabel.toLowerCase()}`, "error");
    } finally {
      setLoading(false);
    }
  }, [endpoint, entityLabel]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({});
    setOpen(true);
  }
  function openEdit(row: Row) {
    setEditing(row);
    const initial: Record<string, string> = {};
    for (const f of fields) {
      const v = row[f.name];
      initial[f.name] =
        v == null ? "" : typeof v === "boolean" ? String(v) : String(v);
    }
    setForm(initial);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const url = editing ? `${endpoint}/${editing.id}` : endpoint;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.issues?.[0]?.message ?? "Gagal menyimpan");
      }
      toast(`${entityLabel} berhasil ${editing ? "diperbarui" : "ditambahkan"}`, "success");
      setOpen(false);
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm(`Hapus ${entityLabel.toLowerCase()} ini?`)) return;
    try {
      const res = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error ?? "Gagal menghapus");
      toast(`${entityLabel} dihapus`, "success");
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
          Tambah {entityLabel}
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Belum ada data {entityLabel.toLowerCase()}.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      {c.map
                        ? c.map[resolve(row, c.key)] ?? resolve(row, c.key)
                        : resolve(row, c.key)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(row)}>
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
        title={`${editing ? "Edit" : "Tambah"} ${entityLabel}`}
      >
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              {f.type !== "checkbox" && (
                <Label htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </Label>
              )}
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  value={form[f.name] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              ) : f.type === "select" ? (
                <Select
                  id={f.name}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : f.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={form[f.name] === "true"}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.name]: String(e.target.checked) }))
                    }
                  />
                  {f.label}
                </label>
              ) : (
                <Input
                  id={f.name}
                  type={f.type === "email" ? "email" : "text"}
                  value={form[f.name] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
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
