'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const TIERS = ['FREE', 'STARTER', 'PREMIUM', 'BUSINESS'] as const;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({ page, limit: 20, search });
  const updateTier = trpc.admin.updateUserTier.useMutation({
    onSuccess: () => { toast.success('Tier diperbarui'); refetch(); },
    onError: () => toast.error('Gagal memperbarui tier'),
  });
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success('Role diperbarui'); refetch(); },
    onError: () => toast.error('Gagal memperbarui role'),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Manajemen Pengguna</h1>
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} pengguna terdaftar</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
                type="search" name="user-search" aria-label="Cari pengguna"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Cari nama atau email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
          />
        </div>
        <Button onClick={() => { setSearch(searchInput); setPage(1); }}>Cari</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Nama</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Undangan</th>
                    <th className="pb-3 pr-4 font-medium">Tier</th>
                    <th className="pb-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">{user.name || '-'}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 pr-4">{user._count.invitations}</td>
                      <td className="py-3 pr-4">
                        <select
                          className="rounded border bg-background px-2 py-1 text-xs"
                          value={user.subscriptionTier}
                          onChange={(e) =>
                            updateTier.mutate({ userId: user.id, tier: e.target.value as typeof TIERS[number] })
                          }
                        >
                          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="py-3">
                        <select
                          className="rounded border bg-background px-2 py-1 text-xs"
                          value={user.role}
                          onChange={(e) =>
                            updateRole.mutate({ userId: user.id, role: e.target.value as 'USER' | 'ADMIN' })
                          }
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {data.pages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
