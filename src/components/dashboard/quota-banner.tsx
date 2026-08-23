'use client';

import Link from 'next/link';
import { AlertCircle, Crown, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function daysUntil(date: Date): number {
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Shows the active plan, remaining invitation quota and the expiry of the
 * soonest-expiring published invitation.
 *
 * Quotas are enforced server-side; this makes them visible up front so hitting
 * a limit reads as a plan boundary rather than a failure.
 */
export function QuotaBanner() {
  const { data: quota, isLoading } = trpc.user.getQuota.useQuery();

  if (isLoading) return <Skeleton className="h-24 rounded-lg" />;
  if (!quota) return null;

  const isFree = quota.tier === 'FREE';
  const quotaExhausted =
    quota.remainingInvitations !== null && quota.remainingInvitations === 0;
  const daysLeft = quota.expiresAt ? daysUntil(quota.expiresAt) : null;
  const expiringSoon = daysLeft !== null && daysLeft <= 30;

  return (
    <div
      className={`rounded-lg border p-4 ${
        quotaExhausted || expiringSoon
          ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
          : 'bg-card'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {isFree ? (
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          ) : (
            <Crown className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          )}

          <div className="space-y-1">
            <p className="font-semibold">
              Paket {quota.tierName}
              {isFree && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  aktif {quota.duration}
                </span>
              )}
            </p>

            <p className="text-sm text-muted-foreground">
              Undangan terpakai:{' '}
              <span className="font-medium">
                {quota.invitationCount}
                {quota.maxInvitations !== -1 && <> / {quota.maxInvitations}</>}
              </span>
              {quota.maxInvitations === -1 && ' (tanpa batas)'}
              {' · '}
              Maks tamu:{' '}
              <span className="font-medium">
                {quota.maxGuests === -1 ? 'tanpa batas' : quota.maxGuests}
              </span>
              {quota.features.hasWatermark && ' · Watermark aktif'}
            </p>

            {quota.expiresAt && (
              <p
                className={`flex items-center gap-1.5 text-sm ${
                  expiringSoon ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                }`}
              >
                {expiringSoon && <AlertCircle className="h-3.5 w-3.5" />}
                Undangan aktif sampai{' '}
                {format(new Date(quota.expiresAt), 'd MMMM yyyy', {
                  locale: localeId,
                })}
                {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} hari lagi)`}
                {daysLeft !== null && daysLeft <= 0 && ' (sudah berakhir)'}
              </p>
            )}

            {quotaExhausted && (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Kuota undangan habis. Upgrade untuk membuat undangan baru.
              </p>
            )}
          </div>
        </div>

        {isFree && (
          <Link href="/dashboard/upgrade" className="shrink-0">
            <Button size="sm">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Paket
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
