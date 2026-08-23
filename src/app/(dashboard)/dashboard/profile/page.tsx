'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Save, Loader2, Crown, KeyRound, ArrowUpRight } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

function limitLabel(value: number): string {
  return value === -1 ? 'Tanpa batas' : String(value);
}

export default function ProfilePage() {
  const { update: updateSession } = useSession();

  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();
  const { data: usage } = trpc.user.getUsageSummary.useQuery();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
  }, [profile]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success('Profil berhasil disimpan');
      await utils.user.getProfile.invalidate();
      // Refresh the session so the sidebar and greeting pick up the new name.
      await updateSession();
    },
    onError: (error) => toast.error(error.message || 'Gagal menyimpan profil'),
  });

  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => toast.error(error.message || 'Gagal mengubah password'),
  });

  // The tier comes from the database, not the session token, so it stays
  // accurate immediately after an upgrade.
  const tier = (profile?.subscriptionTier ?? 'FREE') as SubscriptionTier;
  const tierConfig = SUBSCRIPTION_TIERS[tier] ?? SUBSCRIPTION_TIERS.FREE;

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }
    updateProfile.mutate({ name: name.trim(), phone: phone.trim() });
  };

  const handleChangePassword = () => {
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    changePassword.mutate({
      currentPassword: profile?.hasPassword ? currentPassword : undefined,
      newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Profil</h1>
        <p className="text-muted-foreground">Kelola informasi akun Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
          <CardDescription>Perbarui informasi profil Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nama"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input label="Email" value={profile?.email ?? ''} disabled />
          <Input
            label="No. Handphone"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={updateProfile.isLoading}>
              {updateProfile.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            {profile?.hasPassword ? 'Ubah Password' : 'Buat Password'}
          </CardTitle>
          <CardDescription>
            {profile?.hasPassword
              ? 'Masukkan password lama untuk mengubahnya'
              : 'Akun Anda masuk lewat Google. Buat password agar bisa login manual.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.hasPassword && (
            <Input
              label="Password Lama"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          )}
          <Input
            label="Password Baru"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={changePassword.isLoading || !newPassword}
            >
              {changePassword.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-yellow-500" />
            Langganan
          </CardTitle>
          <CardDescription>Paket langganan Anda saat ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{tierConfig.name}</h3>
                  <Badge variant={tier === 'FREE' ? 'secondary' : 'default'}>{tier}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tierConfig.price > 0
                    ? `${formatCurrency(tierConfig.price)} / ${tierConfig.duration}`
                    : 'Gratis selamanya'}
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/upgrade">
                  {tier === 'BUSINESS' ? 'Lihat Paket' : 'Upgrade'}
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Undangan</span>
                <span className="font-medium">
                  {usage ? `${usage.invitationCount} / ` : ''}
                  {limitLabel(tierConfig.maxInvitations)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tamu</span>
                <span className="font-medium">
                  {usage ? `${usage.guestCount} / ` : ''}
                  {limitLabel(tierConfig.maxGuests)} per undangan
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Galeri Foto</span>
                <span className="font-medium">
                  {limitLabel(tierConfig.maxGalleryImages)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rekening</span>
                <span className="font-medium">
                  {limitLabel(tierConfig.maxBankAccounts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analitik</span>
                <span className="font-medium">
                  {tierConfig.hasAnalytics ? 'Ya' : 'Tidak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">QR Check-in</span>
                <span className="font-medium">
                  {tierConfig.hasQrCheckin ? 'Ya' : 'Tidak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Export Tamu</span>
                <span className="font-medium">
                  {tierConfig.hasExport ? 'Ya' : 'Tidak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Musik Kustom</span>
                <span className="font-medium">
                  {tierConfig.hasCustomMusic ? 'Ya' : 'Tidak'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
