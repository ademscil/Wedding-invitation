'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { InvitationCard } from '@/components/dashboard/invitation-card';
import { QuotaBanner } from '@/components/dashboard/quota-banner';
import { VerificationBanner } from '@/components/dashboard/verification-banner';
import { FloatingGem } from '@/components/3d/floating-gem';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: invitations, isLoading } = trpc.invitation.list.useQuery();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FloatingGem className="h-16 w-16 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Selamat datang, {session?.user?.name || 'Pengguna'}!
            </h1>
            <p className="text-muted-foreground">
              Kelola undangan pernikahan digital Anda
            </p>
          </div>
        </div>
        <Link href="/dashboard/invitations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Undangan Baru
          </Button>
        </Link>
      </div>

      <VerificationBanner />

      {/* Plan, quota and expiry */}
      <QuotaBanner />

      {/* Stats */}
      {isLoading ? (
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
