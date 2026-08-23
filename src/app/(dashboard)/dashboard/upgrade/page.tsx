'use client';

import { useState } from 'react';
import { Check, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SUBSCRIPTION_TIERS as TIERS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

type PaidPlan = 'STARTER' | 'PREMIUM' | 'BUSINESS';

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['1 undangan aktif', '50 tamu', '5 foto galeri', '1 acara', 'Template dasar'],
  STARTER: [
    '3 undangan aktif',
    '200 tamu',
    '15 foto galeri',
    '2 acara',
    'Love story',
    'Statistik dasar',
    '1 rekening bank',
  ],
  PREMIUM: [
    '10 undangan aktif',
    '500 tamu',
    '30 foto galeri',
    '3 acara',
    'Love story',
    'Musik kustom',
    'Custom domain',
    'Statistik lengkap',
    'Export tamu (CSV/Excel)',
    'Broadcast WhatsApp',
    '3 rekening bank',
  ],
  BUSINESS: [
    'Undangan tidak terbatas',
    'Tamu tidak terbatas',
    'Foto tidak terbatas',
    'Acara tidak terbatas',
    'Semua fitur Premium',
    'QR Check-in',
    'Rekening tidak terbatas',
    'Prioritas support',
  ],
};

const SNAP_SCRIPT_ID = 'midtrans-snap';

/** Loads the Snap widget script once and resolves when it is ready. */
function loadSnapScript(clientKey: string, isProduction: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SNAP_SCRIPT_ID);
    if (existing) return resolve();

    const script = document.createElement('script');
    script.id = SNAP_SCRIPT_ID;
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'));
    document.head.appendChild(script);
  });
}

interface SnapCallbacks {
  onSuccess: () => void;
  onPending: () => void;
  onError: () => void;
  onClose: () => void;
}

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: subscription } = trpc.payment.getSubscription.useQuery();
  const { data: history } = trpc.payment.getHistory.useQuery();

  const createCheckout = trpc.payment.createCheckout.useMutation();
  const confirmPayment = trpc.payment.confirmPayment.useMutation();

  const finalize = async (paymentId: string) => {
    const result = await confirmPayment.mutateAsync({ paymentId });

    if (result.success) {
      toast.success('Langganan berhasil diaktifkan!');
      await Promise.all([
        utils.payment.getSubscription.invalidate(),
        utils.payment.getHistory.invalidate(),
      ]);
    } else {
      toast.info('Pembayaran sedang diproses. Paket aktif otomatis setelah lunas.');
      await utils.payment.getHistory.invalidate();
    }
  };

  const handleUpgrade = async (plan: PaidPlan) => {
    setLoading(plan);

    try {
      const checkout = await createCheckout.mutateAsync({ plan });
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '';
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

      // Demo mode has no gateway to open — confirm straight through.
      if (checkout.demoMode || !checkout.snapToken) {
        await finalize(checkout.paymentId);
        setLoading(null);
        return;
      }

      // Without a browser key the widget cannot render; use the hosted page.
      if (!clientKey) {
        if (checkout.redirectUrl) {
          window.location.href = checkout.redirectUrl;
          return;
        }
        throw new Error('Kunci Midtrans belum dikonfigurasi');
      }

      await loadSnapScript(clientKey, isProduction);

      if (!window.snap) {
        throw new Error('Midtrans Snap tidak tersedia');
      }

      window.snap.pay(checkout.snapToken, {
        onSuccess: () => {
          void finalize(checkout.paymentId).finally(() => setLoading(null));
        },
        onPending: () => {
          toast.info('Menunggu pembayaran diselesaikan.');
          setLoading(null);
        },
        onError: () => {
          toast.error('Pembayaran gagal. Silakan coba lagi.');
          setLoading(null);
        },
        onClose: () => {
          toast.info('Pembayaran dibatalkan.');
          setLoading(null);
        },
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Gagal memproses pembayaran';
      toast.error(message);
      setLoading(null);
    }
  };

  const currentTier = (subscription?.tier ?? 'FREE') as keyof typeof TIERS;
  const activeSubscription = subscription?.subscription;

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Upgrade Paket</h1>
        <p className="mt-2 text-muted-foreground">
          Paket Anda saat ini:{' '}
          <span className="font-semibold text-primary">{TIERS[currentTier].name}</span>
          {activeSubscription?.expiresAt && (
            <> · aktif sampai {formatDate(new Date(activeSubscription.expiresAt))}</>
          )}
        </p>
        {subscription?.demoMode && (
          <p className="mx-auto mt-3 max-w-md rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            Mode demo aktif — pembayaran disimulasikan tanpa gateway sungguhan.
          </p>
        )}
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(Object.entries(TIERS) as [string, (typeof TIERS)[keyof typeof TIERS]][]).map(
          ([key, tier]) => {
            const isCurrent = key === currentTier;
            const isPaid = key !== 'FREE';
            const features = PLAN_FEATURES[key] ?? [];
            const isBusy = loading === key;

            return (
              <Card
                key={key}
                className={`relative flex flex-col ${
                  key === 'PREMIUM' ? 'ring-2 ring-primary' : ''
                }`}
              >
                {key === 'PREMIUM' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Populer
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="mt-2">
                    {tier.price === 0 ? (
                      <span className="text-3xl font-bold">Gratis</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">
                          {formatCurrency(tier.price)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {' '}
                          / {tier.duration}
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <ul className="flex-1 space-y-2">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={key === 'PREMIUM' ? 'default' : 'outline'}
                    disabled={isCurrent || !isPaid || isBusy}
                    onClick={() => isPaid && handleUpgrade(key as PaidPlan)}
                  >
                    {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrent
                      ? 'Paket Aktif'
                      : isPaid
                        ? isBusy
                          ? 'Memproses...'
                          : 'Pilih Paket'
                        : 'Gratis'}
                  </Button>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {history && history.length > 0 && (
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              Riwayat Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Tanggal</th>
                    <th className="px-4 py-2 font-medium">Nomor Order</th>
                    <th className="px-4 py-2 font-medium">Jumlah</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {formatDate(new Date(payment.createdAt))}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {payment.gatewayReferenceId ?? '-'}
                      </td>
                      <td className="px-4 py-2">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            payment.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Pembayaran aman melalui Midtrans. Hubungi support untuk bantuan.
      </p>
    </div>
  );
}
