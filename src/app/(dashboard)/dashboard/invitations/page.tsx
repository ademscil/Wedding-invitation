'use client';

import Link from 'next/link';
import { Plus, Mail } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { InvitationCard } from '@/components/dashboard/invitation-card';

export default function InvitationsPage() {
  const {
    data: invitations,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.invitation.list.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Undangan Saya</h1>
          <p className="text-muted-foreground">
            Kelola semua undangan pernikahan Anda
          </p>
        </div>
        <Link href="/dashboard/invitations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Undangan Baru
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : invitations && invitations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invitations.map((invitation) => (
            <InvitationCard key={invitation.id} invitation={invitation} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-20">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">
            Belum ada undangan
          </h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Buat undangan pernikahan digital pertama Anda. Pilih template, isi
            data, dan bagikan ke tamu undangan.
          </p>
          <Link href="/dashboard/invitations/new">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Buat Undangan Pertama
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
