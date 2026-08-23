import Link from 'next/link';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { consumeVerificationToken } from '@/server/lib/verification';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Verifikasi Email' };

// The token is consumed on load, so this must never be cached.
export const dynamic = 'force-dynamic';

const OUTCOMES = {
  verified: {
    icon: CheckCircle2,
    tone: 'text-green-600',
    title: 'Email berhasil diverifikasi',
    body: 'Terima kasih. Akun Anda kini sepenuhnya aktif.',
  },
  'already-verified': {
    icon: CheckCircle2,
    tone: 'text-green-600',
    title: 'Email sudah diverifikasi',
    body: 'Alamat email ini sudah diverifikasi sebelumnya.',
  },
  expired: {
    icon: Clock,
    tone: 'text-amber-600',
    title: 'Tautan sudah kedaluwarsa',
    body: 'Tautan verifikasi berlaku 24 jam. Silakan minta tautan baru dari dashboard.',
  },
  invalid: {
    icon: XCircle,
    tone: 'text-destructive',
    title: 'Tautan tidak valid',
    body: 'Tautan verifikasi tidak dikenali atau sudah digunakan. Silakan minta tautan baru dari dashboard.',
  },
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const result = await consumeVerificationToken(
    prisma,
    searchParams.token ?? ''
  );

  const outcome = OUTCOMES[result.status];
  const Icon = outcome.icon;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <Icon className={`h-12 w-12 ${outcome.tone}`} />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">{outcome.title}</h1>
            <p className="text-sm text-muted-foreground">{outcome.body}</p>
          </div>
          <Link href="/dashboard">
            <Button>Ke Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
