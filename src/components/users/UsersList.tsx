"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, Users as UsersIcon, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";

type User = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  profile?: { jobTitle: string | null; department: string | null } | null;
  appRoles: { applicationKey: string; role: string }[];
};

export function UsersList({ currentUserId }: { currentUserId: string }) {
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await (await fetch("/api/users")).json());
    } catch {
      toast("Gagal memuat pengguna", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(u: User) {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error ?? "Gagal");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengguna</h1>
          <p className="text-sm text-slate-500">Kelola identitas, profil, dan akses per-aplikasi.</p>
        </div>
        <Link href="/users/new">
          <Button><Plus className="h-4 w-4" />Tambah Pengguna</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <UsersIcon className="mb-2 h-8 w-8" />Belum ada pengguna
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Akses Aplikasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-slate-800">
                    <Link href={`/users/${u.id}`} className="hover:text-brand-600">{u.name ?? "-"}</Link>
                    {u.isSuperAdmin && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-brand-600">
                        <ShieldCheck className="h-3 w-3" />Admin
                      </span>
                    )}
                    {u.profile?.jobTitle && (
                      <span className="block text-xs text-slate-400">{u.profile.jobTitle}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.appRoles.length === 0 && <span className="text-xs text-slate-400">-</span>}
                      {u.appRoles.map((r) => (
                        <Badge key={r.applicationKey} className="bg-slate-100 text-slate-600 border-slate-200">
                          {r.applicationKey}: {r.role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={u.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                      {u.isActive ? "Aktif" : "Non-Aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/users/${u.id}`}>
                        <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" />Edit</Button>
                      </Link>
                      {u.id !== currentUserId && (
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(u)}>
                          {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
