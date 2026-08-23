'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * NextAuth's own error page reads "Server error — There is a problem with the
 * server configuration. Check the server logs for more information." That is
 * addressed to an operator, not to someone trying to sign in, and it gives
 * them nothing to act on. This replaces it.
 */
const MESSAGES: Record<string, { title: string; detail: string }> = {
  Configuration: {
    title: 'Masuk sedang bermasalah',
    detail:
      'Ada pengaturan di sisi server yang belum lengkap, jadi proses masuk tidak bisa dilanjutkan. Tim kami perlu memperbaikinya — silakan coba lagi nanti.',
  },
  AccessDenied: {
    title: 'Akses ditolak',
    detail: 'Akun Anda tidak memiliki izin untuk masuk ke halaman ini.',
  },
  Verification: {
    title: 'Tautan sudah tidak berlaku',
    detail:
      'Tautan masuk yang Anda gunakan sudah kedaluwarsa atau pernah dipakai. Silakan minta tautan baru.',
  },
  OAuthAccountNotLinked: {
    title: 'Email sudah terdaftar',
    detail:
      'Email ini sudah pernah didaftarkan dengan cara masuk yang berbeda. Masuk memakai email dan password Anda, lalu hubungkan Google dari halaman profil.',
  },
  OAuthSignin: {
    title: 'Gagal menghubungi Google',
    detail: 'Proses masuk lewat Google tidak selesai. Silakan coba sekali lagi.',
  },
  OAuthCallback: {
    title: 'Gagal menyelesaikan proses masuk',
    detail: 'Google tidak mengembalikan data yang dibutuhkan. Silakan coba lagi.',
  },
};

const FALLBACK = {
  title: 'Gagal masuk',
  detail: 'Terjadi kendala saat memproses permintaan Anda. Silakan coba lagi.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('error') ?? '';
  const { title, detail } = MESSAGES[code] ?? FALLBACK;

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <CardTitle className="font-display text-2xl">{title}</CardTitle>
        <CardDescription className="mt-2">{detail}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Halaman Masuk
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Ke Beranda</Link>
        </Button>

        {/* Useful when reporting the problem, meaningless noise otherwise. */}
        {code && (
          <p className="pt-1 text-center text-xs text-muted-foreground">
            Kode kesalahan: <span className="font-mono">{code}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <AuthErrorContent />
    </Suspense>
  );
}
