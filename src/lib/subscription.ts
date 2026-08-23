import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from './constants';

export type TierLimits = (typeof SUBSCRIPTION_TIERS)[SubscriptionTier];

/** Numeric limit keys — `-1` means unlimited. */
export type QuotaKey =
  | 'maxInvitations'
  | 'maxGuests'
  | 'maxGalleryImages'
  | 'maxEvents'
  | 'maxBankAccounts';

/** Boolean feature-flag keys. */
export type FeatureKey =
  | 'hasLoveStory'
  | 'hasCustomMusic'
  | 'hasCustomDomain'
  | 'hasAnalytics'
  | 'hasBroadcast'
  | 'hasExport'
  | 'hasQrCheckin';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  hasLoveStory: 'Love Story',
  hasCustomMusic: 'Musik kustom',
  hasCustomDomain: 'Domain kustom',
  hasAnalytics: 'Analitik',
  hasBroadcast: 'Broadcast WhatsApp',
  hasExport: 'Export data tamu',
  hasQrCheckin: 'QR Check-in',
};

const QUOTA_LABELS: Record<QuotaKey, string> = {
  maxInvitations: 'undangan',
  maxGuests: 'tamu',
  maxGalleryImages: 'foto galeri',
  maxEvents: 'acara',
  maxBankAccounts: 'rekening',
};

/** Tier ordering, lowest to highest. Used to suggest the cheapest upgrade. */
const TIER_ORDER: SubscriptionTier[] = ['FREE', 'STARTER', 'PREMIUM', 'BUSINESS'];

export function normalizeTier(value: string | null | undefined): SubscriptionTier {
  return TIER_ORDER.includes(value as SubscriptionTier)
    ? (value as SubscriptionTier)
    : 'FREE';
}

export function getLimits(tier: string | null | undefined): TierLimits {
  return SUBSCRIPTION_TIERS[normalizeTier(tier)];
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/** The cheapest tier that unlocks a boolean feature, or null if none do. */
function cheapestTierWith(feature: FeatureKey): SubscriptionTier | null {
  return TIER_ORDER.find((t) => SUBSCRIPTION_TIERS[t][feature]) ?? null;
}

/** The cheapest tier whose quota covers `needed`, or null if none do. */
function cheapestTierFor(quota: QuotaKey, needed: number): SubscriptionTier | null {
  return (
    TIER_ORDER.find((t) => {
      const limit = SUBSCRIPTION_TIERS[t][quota] as number;
      return isUnlimited(limit) || limit >= needed;
    }) ?? null
  );
}

export function hasFeature(tier: string | null | undefined, feature: FeatureKey): boolean {
  return Boolean(getLimits(tier)[feature]);
}

export function withinQuota(
  tier: string | null | undefined,
  quota: QuotaKey,
  count: number
): boolean {
  const limit = getLimits(tier)[quota] as number;
  return isUnlimited(limit) || count <= limit;
}

/**
 * Throws a FORBIDDEN error naming the feature and the plan that unlocks it.
 * The message is user-facing Indonesian and safe to surface directly in a toast.
 */
export function assertFeature(tier: string | null | undefined, feature: FeatureKey): void {
  if (hasFeature(tier, feature)) return;

  const upgrade = cheapestTierWith(feature);
  const planName = upgrade ? SUBSCRIPTION_TIERS[upgrade].name : null;

  throw new TRPCError({
    code: 'FORBIDDEN',
    message: planName
      ? `${FEATURE_LABELS[feature]} tersedia mulai paket ${planName}. Upgrade untuk membuka fitur ini.`
      : `${FEATURE_LABELS[feature]} tidak tersedia pada paket Anda.`,
  });
}

/**
 * Throws a FORBIDDEN error when adding `adding` items would exceed the tier quota.
 * `current` is the existing count.
 */
export function assertQuota(
  tier: string | null | undefined,
  quota: QuotaKey,
  current: number,
  adding = 1
): void {
  const limit = getLimits(tier)[quota] as number;
  if (isUnlimited(limit)) return;

  const total = current + adding;
  if (total <= limit) return;

  const upgrade = cheapestTierFor(quota, total);
  const planName = upgrade ? SUBSCRIPTION_TIERS[upgrade].name : null;
  const label = QUOTA_LABELS[quota];

  throw new TRPCError({
    code: 'FORBIDDEN',
    message: planName
      ? `Batas ${label} paket Anda adalah ${limit}. Upgrade ke paket ${planName} untuk menambah kapasitas.`
      : `Batas ${label} paket Anda adalah ${limit}.`,
  });
}

/** Reads the caller's current tier straight from the database (never trust the JWT). */
export async function getUserTier(
  prisma: PrismaClient,
  userId: string
): Promise<SubscriptionTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });
  return normalizeTier(user?.subscriptionTier);
}
