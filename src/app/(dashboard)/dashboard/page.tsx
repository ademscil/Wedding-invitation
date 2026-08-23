'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { InvitationCard } from '@/components/dashboard/invitation-card';
import { QuotaBanner } from '@/components/dashboard/quota-banner';
import { VerificationBanner } from '@/components/dashboard/verification-banner';
import { FloatingGem } from '@/components/3d/floating-gem';

export default function DashboardPage() {
  const { data: session } = useSession();
  const {
    data: invitations,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.invitation.list.useQuery();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {/* Decorative only — dropped on phones where the greeting needs the width. */}
          <FloatingGem className="hidden h-14 w-14 shrink-0 sm:block lg:h-16 lg:w-16" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">
              Selamat datang, {session?.user?.name || 'Pengguna'}!
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Kelola undangan pernikahan digital Anda
            </p>
          </div>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/dashboard/invitations/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat Undangan Baru
          </Link>
        </Button>
      </div>

      <VerificationBanner />

      {/* Plan, quota and expiry */}
      <QuotaBanner />

      {/* Stats */}
      {isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <StatsCards invitations={invitations || []} />
      )}

      {/* Recent Invitations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Undangan Terbaru</h2>
          {invitations && invitations.length > 0 && (
            <Link href="/dashboard/invitations">
              <Button variant="link" size="sm">
                Lihat semua
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : invitations && invitations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.slice(0, 6).map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-16">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Belum ada undangan
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Mulai buat undangan pernikahan digital pertama Anda
            </p>
            <Link href="/dashboard/invitations/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Buat Undangan Baru
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
