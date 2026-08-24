'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { coupleNames } from '@/lib/invitation-data';

export default function AdminInvitationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = trpc.admin.listInvitations.useQuery({ page, limit: 20 });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Semua Undangan</h1>
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} undangan dibuat</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Undangan</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState message={error?.message} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !data || data.invitations.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada undangan dibuat.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Pasangan</th>
                    <th className="pb-3 pr-4 font-medium">Pemilik</th>
                    <th className="pb-3 pr-4 font-medium">Template</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Tamu</th>
                    <th className="pb-3 pr-4 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">
                        {coupleNames(inv)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {inv.user.name || inv.user.email}
                      </td>
                      <td className="py-3 pr-4 text-xs">{inv.template?.name ?? '-'}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{inv._count.guests}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="py-3">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/${inv.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Buka undangan ${coupleNames(inv)} di tab baru`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Halaman {page} dari {data.pages}</p>
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
