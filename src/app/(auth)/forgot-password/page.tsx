'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const schema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Email tidak valid'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const requestReset = trpc.user.requestPasswordReset.useMutation();

  const onSubmit = async (values: FormValues) => {
    try {
      await requestReset.mutateAsync({ email: values.email });
    } catch {
      // The server answers the same way whether or not the address exists, so
      // there is nothing useful to distinguish here either.
    }
    setSentTo(values.email);
  };

  /*
   * The confirmation never says whether an account was found. Doing so would
   * turn this form into a way to check which addresses are registered.
   */
  if (sentTo) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Cek Email Anda</CardTitle>
          <CardDescription className="mt-2">
            Jika <span className="font-medium">{sentTo}</span> terdaftar, kami sudah
            mengirim tautan untuk mengatur ulang password. Tautan berlaku 1 jam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Tidak menerima email? Periksa folder spam, atau coba lagi beberapa saat
            lagi.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Halaman Masuk
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Lupa Password</CardTitle>
        <CardDescription>
          Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password
          baru.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" className="w-full" disabled={requestReset.isLoading}>
            {requestReset.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Tautan Reset
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Ingat password Anda?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
