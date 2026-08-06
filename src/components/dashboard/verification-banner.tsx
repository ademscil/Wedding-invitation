'use client';

import { MailWarning } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';

/**
 * Prompts the user to verify their email.
 *
 * Verification is not required to sign in — blocking access would strand
 * accounts whenever mail delivery fails — so this stays a nudge.
 */
export function VerificationBanner() {
  const utils = trpc.useUtils();
  const { data } = trpc.user.getVerificationStatus.useQuery();

  const resend = trpc.user.sendVerificationEmail.useMutation({
    onSuccess: (result) => {
      if (result.alreadyVerified) {
        toast.success('Email Anda sudah terverifikasi');
        utils.user.getVerificationStatus.invalidate();
        return;
      }
      toast.success('Email verifikasi telah dikirim. Silakan cek inbox Anda.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengirim email verifikasi');
    },
  });

  if (!data || data.isVerified) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Email belum diverifikasi
            </p>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
              Verifikasi email {data.email ? `(${data.email})` : ''} agar akun
              Anda tetap aman dan mudah dipulihkan.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100"
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
        >
          {resend.isPending ? 'Mengirim...' : 'Kirim Ulang Verifikasi'}
        </Button>
      </div>
    </div>
  );
}
