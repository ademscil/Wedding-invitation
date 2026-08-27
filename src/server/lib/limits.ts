import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants';

type TierLimits = (typeof SUBSCRIPTION_TIERS)[SubscriptionTier];

/** Resolves a user's tier config, falling back to FREE for unknown values. */
export async function getUserLimits(
  prisma: PrismaClient,
  userId: string
): Promise<{ tier: SubscriptionTier; limits: TierLimits }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = (user?.subscriptionTier ?? 'FREE') as SubscriptionTier;
  const limits = SUBSCRIPTION_TIERS[tier] ?? SUBSCRIPTION_TIERS.FREE;

  return { tier, limits };
}

/** A limit of -1 means unlimited. */
export function isWithinLimit(count: number, max: number): boolean {
  return max === -1 || count <= max;
}

/**
 * Counts how many entries a JSON-array column holds.
 * Returns 0 for malformed data so a bad value can't bypass the check by throwing.
 */
export function countJsonArray(value: string | undefined | null): number {
  if (!value) return 0;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function quotaError(message: string): TRPCError {
  return new TRPCError({ code: 'FORBIDDEN', message });
}

/** Boolean capability flags that gate a feature rather than cap a count. */
export type FeatureFlag =
  | 'hasLoveStory'
  | 'hasCustomMusic'
  | 'hasAnalytics'
  | 'hasBroadcast'
  | 'hasExport'
  | 'hasQrCheckin'
  | 'hasEventPlanner';

const FEATURE_LABELS: Record<FeatureFlag, string> = {
  hasLoveStory: 'Love story',
  hasCustomMusic: 'Musik kustom',
  hasAnalytics: 'Statistik undangan',
  hasBroadcast: 'Broadcast WhatsApp',
  hasExport: 'Export data tamu',
  hasQrCheckin: 'QR check-in',
  hasEventPlanner: 'Event planner',
};

/**
 * Blocks a feature the current plan does not include.
 *
 * These flags are advertised on the pricing page, so they have to be enforced
 * on the server — hiding a button is not a gate.
 */
export async function assertFeature(
  prisma: PrismaClient,
  userId: string,
  feature: FeatureFlag
) {
  const { limits } = await getUserLimits(prisma, userId);

  if (!limits[feature]) {
    throw quotaError(
      `${FEATURE_LABELS[feature]} tidak tersedia pada paket ${limits.name}. Upgrade paket untuk menggunakannya.`
    );
  }
}

/** Blocks creating more invitations than the plan allows. */
export async function assertCanCreateInvitation(
  prisma: PrismaClient,
  userId: string
) {
  const { limits } = await getUserLimits(prisma, userId);
  const current = await prisma.invitation.count({ where: { userId } });

  if (!isWithinLimit(current + 1, limits.maxInvitations)) {
    throw quotaError(
      `Paket ${limits.name} hanya mengizinkan ${limits.maxInvitations} undangan. Upgrade paket untuk menambah undangan.`
    );
  }
}

/** Blocks adding guests beyond the plan's cap for a single invitation. */
export async function assertCanAddGuests(
  prisma: PrismaClient,
  userId: string,
  invitationId: string,
  adding: number
) {
  const { limits } = await getUserLimits(prisma, userId);
  const current = await prisma.guest.count({ where: { invitationId } });

  if (!isWithinLimit(current + adding, limits.maxGuests)) {
    const remaining = Math.max(0, limits.maxGuests - current);
    throw quotaError(
      `Paket ${limits.name} dibatasi ${limits.maxGuests} tamu per undangan (sisa ${remaining}). Upgrade paket untuk menambah tamu.`
    );
  }
}

/** Blocks selecting a premium template on a free plan. */
export async function assertCanUseTemplate(
  prisma: PrismaClient,
  userId: string,
  templateId: string
) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { isPremium: true, isActive: true, name: true },
  });

  if (!template || !template.isActive) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Template tidak ditemukan' });
  }

  if (!template.isPremium) return;

  const { tier, limits } = await getUserLimits(prisma, userId);
  if (tier === 'FREE') {
    throw quotaError(
      `Template "${template.name}" hanya tersedia untuk paket berbayar. Paket Anda saat ini: ${limits.name}.`
    );
  }
}

/**
 * Validates the JSON-array content columns against the plan's caps.
 *
 * Only the fields present in the update are checked, and a field that is
 * already over its cap is grandfathered: the caller may keep or reduce what is
 * there, but not add more. Without that, an account that downgrades (or content
 * created before limits existed) could never be saved again.
 */
export async function assertContentWithinLimits(
  prisma: PrismaClient,
  userId: string,
  content: {
    events?: string;
    galleryImages?: string;
    bankAccounts?: string;
    loveStory?: string;
  },
  current?: {
    events?: string | null;
    galleryImages?: string | null;
    bankAccounts?: string | null;
    loveStory?: string | null;
  }
) {
  const { limits } = await getUserLimits(prisma, userId);

  const checks: Array<{
    next?: string;
    existing?: string | null;
    max: number;
    label: string;
  }> = [
    {
      next: content.events,
      existing: current?.events,
      max: limits.maxEvents,
      label: 'acara',
    },
    {
      next: content.galleryImages,
      existing: current?.galleryImages,
      max: limits.maxGalleryImages,
      label: 'foto galeri',
    },
    {
      next: content.bankAccounts,
      existing: current?.bankAccounts,
      max: limits.maxBankAccounts,
      label: 'rekening bank',
    },
  ];

  for (const { next, existing, max, label } of checks) {
    if (next === undefined) continue;

    const nextCount = countJsonArray(next);
    if (isWithinLimit(nextCount, max)) continue;

    // Over the cap: allowed only if it is not an increase on what's stored.
    const existingCount = countJsonArray(existing);
    if (nextCount <= existingCount) continue;

    throw quotaError(
      max === 0
        ? `Fitur ${label} tidak tersedia pada paket ${limits.name}. Upgrade paket untuk menggunakannya.`
        : `Paket ${limits.name} dibatasi ${max} ${label}. Upgrade paket untuk menambah.`
    );
  }

  if (content.loveStory !== undefined && !limits.hasLoveStory) {
    const nextCount = countJsonArray(content.loveStory);
    const existingCount = countJsonArray(current?.loveStory);

    if (nextCount > 0 && nextCount > existingCount) {
      throw quotaError(
        `Fitur love story tidak tersedia pada paket ${limits.name}. Upgrade paket untuk menggunakannya.`
      );
    }
  }
}

/**
 * Gates plan-restricted keys inside the settings JSON blob.
 *
 * Grandfathered like the array columns: a value that is already stored can be
 * kept, but a plan without the feature cannot set a new one.
 */
export async function assertSettingsWithinLimits(
  prisma: PrismaClient,
  userId: string,
  nextSettings: string | undefined,
  currentSettings?: string | null
) {
  if (nextSettings === undefined) return;

  const parse = (value: string | null | undefined): Record<string, unknown> => {
    if (!value) return {};
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  };

  const next = parse(nextSettings);
  const current = parse(currentSettings);

  const nextMusic = typeof next.musicUrl === 'string' ? next.musicUrl : '';
  const currentMusic =
    typeof current.musicUrl === 'string' ? current.musicUrl : '';

  if (nextMusic && nextMusic !== currentMusic) {
    const { limits } = await getUserLimits(prisma, userId);
    if (!limits.hasCustomMusic) {
      throw quotaError(
        `Musik kustom tidak tersedia pada paket ${limits.name}. Upgrade paket untuk menggunakannya.`
      );
    }
  }
}
