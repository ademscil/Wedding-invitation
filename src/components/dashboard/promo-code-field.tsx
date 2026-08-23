'use client';

import { useState } from 'react';
import { Tag, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

type Applied = { code: string; discount: number; plan: string } | null;

const PLANS = ['STARTER', 'PREMIUM', 'BUSINESS'] as const;

/**
 * Entry point for a promo code.
 *
 * A code's worth depends on which plan it is applied to, so the price shown
 * here is only a preview — checkout re-evaluates the code server-side before
 * anyone is charged.
 */
export function PromoCodeField({
  value,
  onChange,
  applied,
  onApplied,
}: {
  value: string;
  onChange: (value: string) => void;
  applied: Applied;
  onApplied: (applied: Applied) => void;
}) {
  const [checking, setChecking] = useState(false);
  const utils = trpc.useUtils();

  const apply = async () => {
    const code = value.trim();
    if (code === '') return;

    setChecking(true);
    try {
      /*
       * A code may be restricted to certain plans, and we do not know yet
       * which plan the customer will pick. Price it against each in turn and
       * keep the first that is accepted.
       */
      for (const plan of PLANS) {
        try {
          const result = await utils.payment.previewPromo.fetch({ plan, code });
          onApplied({ code: result.code, discount: result.discount, plan });
          toast.success(
            `Kode ${result.code} aktif — hemat ${formatCurrency(result.discount)} untuk paket ${plan}.`
          );
          return;
        } catch {
          // Try the next plan before deciding the code is unusable.
        }
      }

      // Ask once more without swallowing the reason, so the customer is told
      // why the code was refused rather than just "invalid".
      await utils.payment.previewPromo.fetch({ plan: 'PREMIUM', code });
    } catch (error) {
      onApplied(null);
      toast.error(
        error instanceof Error ? error.message : 'Kode promo tidak valid'
      );
    } finally {
      setChecking(false);
    }
  };

  if (applied) {
    return (
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-success/40 bg-success/5 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-success" />
          <p className="truncate text-sm">
            <span className="font-semibold">{applied.code}</span> — hemat{' '}
            {formatCurrency(applied.discount)} untuk paket {applied.plan}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onApplied(null);
            onChange('');
          }}
          aria-label="Hapus kode promo"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
      <div className="relative min-w-0 flex-1">
        <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply();
          }}
          placeholder="Punya kode promo?"
          aria-label="Kode promo"
          className="pl-9 uppercase"
          maxLength={40}
        />
      </div>
      <Button
        variant="outline"
        onClick={apply}
        disabled={value.trim() === '' || checking}
      >
        {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Gunakan
      </Button>
    </div>
  );
}
