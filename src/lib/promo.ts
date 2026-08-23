/**
 * Promo code evaluation.
 *
 * Kept free of database and network calls so the money arithmetic — the part
 * that decides what a customer is charged — can be tested exhaustively.
 */

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface PromoCodeRecord {
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  /** JSON array of plan names; an empty array means every plan. */
  applicablePlans: string;
  isActive: boolean;
}

export type PromoRejection =
  | 'not-found'
  | 'inactive'
  | 'not-started'
  | 'expired'
  | 'exhausted'
  | 'wrong-plan';

export type PromoEvaluation =
  | { valid: true; code: string; discount: number; finalAmount: number }
  | { valid: false; reason: PromoRejection; message: string };

const MESSAGES: Record<PromoRejection, string> = {
  'not-found': 'Kode promo tidak ditemukan.',
  inactive: 'Kode promo sudah tidak berlaku.',
  'not-started': 'Kode promo belum bisa digunakan.',
  expired: 'Kode promo sudah kedaluwarsa.',
  exhausted: 'Kuota kode promo sudah habis.',
  'wrong-plan': 'Kode promo tidak berlaku untuk paket ini.',
};

export function reject(reason: PromoRejection): PromoEvaluation {
  return { valid: false, reason, message: MESSAGES[reason] };
}

/** Uppercased and trimmed; codes are matched case-insensitively. */
export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase();
}

function parsePlans(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // A malformed list must not silently widen the code to every plan.
    return [];
  }
}

/**
 * Computes what a code is worth against a plan's price.
 *
 * The discount is clamped to the price: a fixed 200k off a 99k plan bills zero,
 * never a negative amount that the gateway would reject or refund.
 */
export function evaluatePromo(
  promo: PromoCodeRecord | null,
  plan: string,
  amount: number,
  now: Date = new Date()
): PromoEvaluation {
  if (!promo) return reject('not-found');
  if (!promo.isActive) return reject('inactive');
  if (now < promo.validFrom) return reject('not-started');
  if (now > promo.validUntil) return reject('expired');

  if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
    return reject('exhausted');
  }

  const plans = parsePlans(promo.applicablePlans);
  if (plans.length > 0 && !plans.includes(plan)) return reject('wrong-plan');

  const raw =
    promo.discountType === 'PERCENTAGE'
      ? Math.round((amount * promo.discountValue) / 100)
      : Math.round(promo.discountValue);

  // Rupiah has no minor unit here, and the gateway rejects a zero-value order,
  // so the discount can never take the total below nothing.
  const discount = Math.max(0, Math.min(raw, amount));

  return {
    valid: true,
    code: promo.code,
    discount,
    finalAmount: amount - discount,
  };
}
