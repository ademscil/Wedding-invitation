'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export default function AdminWishesPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<boolean | undefined>(false);
  const { data, isLoading, refetch } = trpc.admin.listWishes.useQuery({
    page,
    limit: 20,
    isApproved: filter,
  });
  const moderate = trpc.admin.moderateWish.useMutation({
    onSuccess: () => { toast.success('Ucapan diperbarui'); refetch(); },
    onError: () => toast.error('Gagal memperbarui'),
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Moderasi Ucapan</h1>
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} ucapan</p>
      </div>

      <div className="flex gap-2">
        {[
          { label: 'Menunggu', value: false },
          { label: 'Disetujui', value: true },
          { label: 'Semua', value: undefined },
        ].map((opt) => (
          <Button
            key={String(opt.value)}
            variant={filter === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilter(opt.value as boolean | undefined); setPage(1); }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Ucapan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.wishes.map((wish) => (
                <div key={wish.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{wish.guestName}</span>
                      <Link
                        href={`/${wish.invitation.slug}`}
                        target="_blank"
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {wish.invitation.brideName} & {wish.invitation.groomName}
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{wish.message}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!wish.isApproved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                        onClick={() => moderate.mutate({ wishId: wish.id, isApproved: true })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {wish.isApproved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => moderate.mutate({ wishId: wish.id, isApproved: false })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {data?.wishes.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada ucapan
                </p>
              )}
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
