'use client';

import Link from 'next/link';
import { Lock, Crown } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Feature =
  | 'hasLoveStory'
  | 'hasCustomMusic'
  | 'hasCustomDomain'
  | 'hasAnalytics'
  | 'hasBroadcast'
  | 'hasExport'
  | 'hasQrCheckin'
  | 'hasEventPlanner';

/** Reads the caller's plan capabilities. Undefined while loading. */
export function useFeature(feature: Feature): boolean | undefined {
  const { data } = trpc.user.getQuota.useQuery();
  return data?.features[feature];
}

/**
 * Full-page placeholder for a feature the current plan does not include.
 * The server rejects these calls regardless; this exists so the user gets an
 * upgrade path instead of an error toast.
 */
export function FeatureLocked({
  title,
  description,
  requiredPlan,
}: {
  title: string;
  description: string;
  requiredPlan: string;
}) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-sm font-medium">
            Tersedia mulai paket {requiredPlan}.
          </p>
        </div>
        <Link href="/dashboard/upgrade">
          <Button>
            <Crown className="mr-2 h-4 w-4" />
            Upgrade Paket
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
