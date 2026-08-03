'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Save, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: subscription } = trpc.payment.getSubscription.useQuery();
  const tier = (subscription?.tier as SubscriptionTier) || 'FREE';
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.FREE;

  const handleSave = async () => {
    setSaving(true);
    // Profile update would be handled by a tRPC procedure (not yet implemented)
    // For now, show a placeholder toast
    setTimeout(() => {
      setSaving(false);
      toast.success('Profil berhasil disimpan');
    }, 500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Profil</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun Anda
        </p>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
          <CardDescription>
            Perbarui informasi profil Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nama"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            value={session?.user?.email || ''}
            disabled
          />
          <Input
            label="No. Handphone"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-yellow-500" />
            Langganan
          </CardTitle>
          <CardDescription>
            Paket langganan Anda saat ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{tierConfig.name}</h3>
                  <Badge
                    variant={tier === 'FREE' ? 'secondary' : 'default'}
                  >
                    {tier}
                  </Badge>
                </div>
                {tierConfig.price > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(tierConfig.price)} / {tierConfig.duration}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gratis selamanya
                  </p>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maks Undangan</span>
                <span className="font-medium">
                  {tierConfig.maxInvitations === -1
                    ? 'Unlimited'
                    : tierConfig.maxInvitations}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maks Tamu</span>
                <span className="font-medium">
                  {tierConfig.maxGuests === -1
                    ? 'Unlimited'
                    : tierConfig.maxGuests}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Galeri Foto</span>
                <span className="font-medium">
                  {tierConfig.maxGalleryImages === -1
                    ? 'Unlimited'
                    : tierConfig.maxGalleryImages}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custom Domain</span>
                <span className="font-medium">
                  {tierConfig.hasCustomDomain ? 'Ya' : 'Tidak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analitik</span>
                <span className="font-medium">
                  {tierConfig.hasAnalytics ? 'Ya' : 'Tidak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Watermark</span>
                <span className="font-medium">
                  {tierConfig.hasWatermark ? 'Ada' : 'Tidak ada'}
                </span>
              </div>
            </div>

            {tier === 'FREE' && (
              <div className="mt-4">
                <Button className="w-full">Upgrade Paket</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
