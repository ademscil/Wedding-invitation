'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';

const schema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [done, setDone] = useState(false);

  // Checked before the form is shown, so a stale link is reported up front
  // rather than after the visitor has typed a new password twice.
  const { data: tokenCheck, isLoading: checking } =
    trpc.user.checkPasswordResetToken.useQuery(
      { token },
      { enabled: token.length > 0, retry: false }
    );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const resetPassword = trpc.user.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true);
      toast.success('Password berhasil diubah');
    },
    onError: (error) => toast.error(error.message || 'Gagal mengubah password'),
  });

  if (done) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <CardTitle className="font-display text-2xl">Password Diperbarui</CardTitle>
          <CardDescription className="mt-2">
            Silakan masuk dengan password baru Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Masuk Sekarang
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!token || (!checking && !tokenCheck?.valid)) {
    const expired = tokenCheck?.reason === 'expired';

    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="font-display text-2xl">
            {expired ? 'Tautan Kedaluwarsa' : 'Tautan Tidak Valid'}
          </CardTitle>
          <CardDescription className="mt-2">
            {expired
              ? 'Tautan reset hanya berlaku 1 jam. Silakan minta tautan baru.'
              : 'Tautan ini tidak dikenali atau sudah pernah dipakai.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/forgot-password">Minta Tautan Baru</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Kembali ke Halaman Masuk</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (checking) {
    return (
      <Card className="shadow-lg">
        <CardContent className="space-y-4 py-8">
          <Skeleton className="mx-auto h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="font-display text-2xl">Buat Password Baru</CardTitle>
        <CardDescription>Masukkan password baru untuk akun Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) =>
            resetPassword.mutate({ token, newPassword: values.password })
          )}
          className="space-y-4"
        >
          <Input
            label="Password Baru"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full" disabled={resetPassword.isLoading}>
            {resetPassword.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Password Baru
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
