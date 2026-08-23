'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SUBSCRIPTION_TIERS as TIERS } from '@/lib/constants';
import { toast } from 'sonner';
import { FloatingGem } from '@/components/3d/floating-gem';

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: [
    '1 undangan aktif',
    '50 tamu',
    '5 foto galeri',
    '1 acara',
    'Template dasar',
  ],
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
    'Statistik lengkap',
    'Export tamu (CSV)',
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

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const { update: updateSession } = useSession();
  const { data: subscription } = trpc.payment.getSubscription.useQuery();
  const createCheckout = trpc.payment.createCheckout.useMutation();
  const confirmPayment = trpc.payment.confirmPayment.useMutation({
    onSuccess: async () => {
      toast.success('Langganan berhasil diaktifkan!');
      await updateSession();
      window.location.reload();
    },
  });

  const handleUpgrade = async (plan: 'STARTER' | 'PREMIUM' | 'BUSINESS') => {
    setLoading(plan);
    try {
      const result = await createCheckout.mutateAsync({ plan });

      if (!result.snapToken || typeof window === 'undefined') {
        // No Snap token means the gateway is not configured. The plan can only be
        // activated by a verified payment, so stop here rather than pretending.
        toast.error(
          'Pembayaran belum tersedia saat ini. Silakan hubungi administrator.'
        );
        setLoading(null);
        return;
      }

      // Open the Midtrans Snap payment popup
      const snapJsUrl = result.isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

      const script = document.createElement('script');
      script.src = snapJsUrl;
      script.setAttribute(
        'data-client-key',
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ''
      );
      script.onload = () => {
        // @ts-expect-error — Midtrans Snap injected globally
        window.snap?.pay(result.snapToken, {
          // The server re-checks the transaction with Midtrans before granting
          // anything, so this callback only triggers that verification.
          onSuccess: async () => {
            try {
              await confirmPayment.mutateAsync({ paymentId: result.paymentId });
            } catch {
              toast.error(
                'Pembayaran diterima, namun aktivasi tertunda. Paket akan aktif otomatis dalam beberapa saat.'
              );
            } finally {
              setLoading(null);
            }
          },
          onPending: () => {
            toast.info('Menunggu pembayaran...');
            setLoading(null);
          },
          onError: () => {
            toast.error('Pembayaran gagal');
            setLoading(null);
          },
          onClose: () => setLoading(null),
        });
      };
      script.onerror = () => {
        toast.error('Gagal memuat halaman pembayaran');
        setLoading(null);
      };
      document.head.appendChild(script);
    } catch {
      toast.error('Gagal memproses pembayaran');
      setLoading(null);
    }
  };

  const currentTier = subscription?.tier ?? 'FREE';

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <FloatingGem className="mx-auto mb-2 h-20 w-20" />
        <h1 className="text-3xl font-bold">Upgrade Paket</h1>
        <p className="mt-2 text-muted-foreground">
          Paket Anda saat ini: <span className="font-semibold text-primary">{TIERS[currentTier as keyof typeof TIERS].name}</span>
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(Object.entries(TIERS) as [string, typeof TIERS[keyof typeof TIERS]][]).map(([key, tier]) => {
          const isCurrent = key === currentTier;
          const isPaid = key !== 'FREE';
          const features = PLAN_FEATURES[key] ?? [];

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
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tier.price)}
                      </span>
                      <span className="text-sm text-muted-foreground"> / {tier.duration}</span>
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
                  disabled={isCurrent || !isPaid || loading === key}
                  onClick={() => isPaid && handleUpgrade(key as 'STARTER' | 'PREMIUM' | 'BUSINESS')}
                >
                  {isCurrent ? 'Paket Aktif' : isPaid ? (loading === key ? 'Memproses...' : 'Pilih Paket') : 'Gratis'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Pembayaran aman melalui Midtrans. Hubungi support@wedinvite.id untuk bantuan.
      </p>
    </div>
  );
}
