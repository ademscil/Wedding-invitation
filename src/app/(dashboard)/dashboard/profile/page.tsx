'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Save, Loader2, Crown, KeyRound } from 'lucide-react';
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
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: subscription } = trpc.payment.getSubscription.useQuery();
  const { data: authMethods } = trpc.user.getAuthMethods.useQuery();
  const { data: profile } = trpc.user.getProfile.useQuery();

  // Hydrate the form from the database rather than the session token, so a
  // value changed elsewhere is reflected here.
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
  }, [profile]);
  const tier = (subscription?.tier as SubscriptionTier) || 'FREE';
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.FREE;

  const setPasswordMutation = trpc.user.setPassword.useMutation({
    onSuccess: () => {
      toast.success(authMethods?.hasPassword ? 'Password berhasil diubah' : 'Password berhasil dibuat');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      utils.user.getAuthMethods.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimpan password');
    },
  });

  const utils = trpc.useUtils();

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setPasswordMutation.mutate({
      currentPassword: authMethods?.hasPassword ? currentPassword : undefined,
      newPassword,
    });
  };

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success('Profil berhasil disimpan');
      await utils.user.getProfile.invalidate();
      // Refresh the session so the sidebar picks up the new name.
      await updateSession();
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimpan profil');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }
    updateProfileMutation.mutate({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Pengaturan Profil</h1>
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
            value={profile?.email ?? session?.user?.email ?? ''}
            disabled
          />
          <Input
            label="No. Handphone"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={updateProfileMutation.isLoading}>
              {updateProfileMutation.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            {authMethods?.hasPassword ? 'Ubah Password' : 'Buat Password'}
          </CardTitle>
          <CardDescription>
            {authMethods?.hasPassword
              ? 'Ganti password akun Anda'
              : 'Akun Anda masuk lewat Google. Buat password agar juga bisa login manual dengan email & password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            {authMethods?.hasPassword && (
              <Input
                label="Password Saat Ini"
                type="password"
                placeholder="Masukkan password saat ini"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            )}
            <Input
              label="Password Baru"
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Konfirmasi Password Baru"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={setPasswordMutation.isLoading}>
                {setPasswordMutation.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                {authMethods?.hasPassword ? 'Ubah Password' : 'Buat Password'}
              </Button>
            </div>
          </form>
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
                <span className="text-muted-foreground">Domain Kustom</span>
                {/* Not built yet, so it is not part of any plan. Saying
                    "Tidak" would read as a limitation of this tier. */}
                <span className="font-medium text-muted-foreground">Segera hadir</span>
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
