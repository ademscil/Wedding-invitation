'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

const PLANS = ['STARTER', 'PREMIUM', 'BUSINESS'] as const;
type Plan = (typeof PLANS)[number];

function todayPlus(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function AdminPromosPage() {
  const utils = trpc.useUtils();
  const { data: promos, isLoading } = trpc.admin.listPromos.useQuery();

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState(todayPlus(0));
  const [validUntil, setValidUntil] = useState(todayPlus(30));
  const [plans, setPlans] = useState<Plan[]>([]);

  const refresh = () => utils.admin.listPromos.invalidate();

  const create = trpc.admin.createPromo.useMutation({
    onSuccess: () => {
      toast.success('Kode promo dibuat');
      setCode('');
      setMaxUses('');
      setPlans([]);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const update = trpc.admin.updatePromo.useMutation({
    onSuccess: () => refresh(),
    onError: (error) => toast.error(error.message),
  });

  const remove = trpc.admin.deletePromo.useMutation({
    onSuccess: () => {
      toast.success('Kode dihapus');
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const togglePlan = (plan: Plan) =>
    setPlans((current) =>
      current.includes(plan)
        ? current.filter((entry) => entry !== plan)
        : [...current, plan]
    );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Kode Promo</h1>
        <p className="text-sm text-muted-foreground">
          {promos?.length ?? 0} kode terdaftar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buat Kode Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="promo-code">
                Kode
              </label>
              <Input
                id="promo-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="NIKAH2026"
                className="uppercase"
                maxLength={40}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="promo-type">
                Jenis Diskon
              </label>
              <select
                id="promo-type"
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Nominal (Rp)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="promo-value">
                {discountType === 'PERCENTAGE' ? 'Diskon (%)' : 'Diskon (Rp)'}
              </label>
              <Input
                id="promo-value"
                type="number"
                min={1}
                max={discountType === 'PERCENTAGE' ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="promo-max">
                Batas Pemakaian
              </label>
              <Input
                id="promo-max"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Kosongkan = tanpa batas"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="promo-from">
                Berlaku Dari
              </label>
              <Input
                id="promo-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="promo-until">
                Berlaku Sampai
              </label>
              <Input
                id="promo-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Berlaku untuk paket</p>
            <div className="flex flex-wrap gap-2">
              {PLANS.map((plan) => (
                <Button
                  key={plan}
                  type="button"
                  size="sm"
                  variant={plans.includes(plan) ? 'default' : 'outline'}
                  onClick={() => togglePlan(plan)}
                >
                  {plan}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Tidak ada yang dipilih = berlaku untuk semua paket berbayar.
            </p>
          </div>

          <Button
            onClick={() =>
              create.mutate({
                code,
                discountType,
                discountValue: Number(discountValue),
                maxUses: maxUses.trim() === '' ? null : Number(maxUses),
                validFrom,
                // Include the whole final day, not midnight at its start.
                validUntil: `${validUntil}T23:59:59.999Z`,
                applicablePlans: plans,
              })
            }
            disabled={code.trim() === '' || create.isLoading}
          >
            {create.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Buat Kode
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Kode</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !promos || promos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada kode promo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Kode</th>
                    <th className="pb-3 pr-4 font-medium">Diskon</th>
                    <th className="pb-3 pr-4 font-medium">Dipakai</th>
                    <th className="pb-3 pr-4 font-medium">Berlaku</th>
                    <th className="pb-3 pr-4 font-medium">Paket</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo) => {
                    const applicable = (() => {
                      try {
                        const parsed: unknown = JSON.parse(promo.applicablePlans);
                        return Array.isArray(parsed) && parsed.length > 0
                          ? parsed.join(', ')
                          : 'Semua';
                      } catch {
                        return 'Semua';
                      }
                    })();

                    return (
                      <tr key={promo.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-mono font-medium">
                          {promo.code}
                        </td>
                        <td className="py-3 pr-4">
                          {promo.discountType === 'PERCENTAGE'
                            ? `${promo.discountValue}%`
                            : formatCurrency(promo.discountValue)}
                        </td>
                        <td className="py-3 pr-4">
                          {promo.currentUses}
                          {promo.maxUses !== null ? ` / ${promo.maxUses}` : ''}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                          {formatDate(promo.validUntil)}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {applicable}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                            {promo.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                update.mutate({
                                  id: promo.id,
                                  isActive: !promo.isActive,
                                })
                              }
                            >
                              {promo.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            {promo.currentUses === 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => remove.mutate({ id: promo.id })}
                                aria-label={`Hapus kode ${promo.code}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
