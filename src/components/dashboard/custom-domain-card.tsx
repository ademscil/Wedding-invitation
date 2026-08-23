'use client';

import { useState } from 'react';
import {
  Globe,
  Check,
  Loader2,
  AlertCircle,
  Copy,
  Trash2,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFeature } from './feature-gate';

/**
 * Connecting a domain the couple already owns.
 *
 * The work happens at their registrar, not here, so the job of this card is to
 * show exactly one record to create and then tell them, without ambiguity,
 * whether it has taken effect yet.
 */
export function CustomDomainCard({ invitationId }: { invitationId: string }) {
  const allowed = useFeature('hasCustomDomain');
  const utils = trpc.useUtils();
  const [input, setInput] = useState('');

  const status = trpc.domain.status.useQuery(
    { invitationId },
    { enabled: allowed === true }
  );

  const invalidate = () => utils.domain.status.invalidate({ invitationId });

  const set = trpc.domain.set.useMutation({
    onSuccess: () => {
      toast.success('Domain terhubung. Sekarang tambahkan record DNS di bawah.');
      setInput('');
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const verify = trpc.domain.verify.useMutation({
    onSuccess: (result) => {
      if (result.verified) toast.success('Domain aktif dan siap dipakai.');
      else toast.info('DNS belum terbaca. Perubahan DNS bisa butuh hingga 48 jam.');
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = trpc.domain.remove.useMutation({
    onSuccess: () => {
      toast.success('Domain dilepas.');
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (allowed === false) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Pakai domain sendiri</p>
            <p className="text-sm text-muted-foreground">
              Undangan Anda tampil di alamat seperti{' '}
              <span className="whitespace-nowrap">rina-dan-budi.com</span>.
            </p>
          </div>
        </div>
        <Link href="/dashboard/upgrade" className="shrink-0">
          <Button size="sm" variant="outline">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  if (allowed === undefined || status.isLoading) {
    return (
      <div className="flex items-center gap-2 p-1 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat…
      </div>
    );
  }

  const data = status.data;

  if (data && !data.apiConfigured) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-900 dark:text-amber-200">
          Domain kustom belum diaktifkan di server. Hubungi dukungan untuk
          mengaktifkannya.
        </p>
      </div>
    );
  }

  if (!data?.domain) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Sudah punya domain sendiri? Hubungkan di sini. Domain harus sudah Anda
          beli terlebih dahulu di penyedia seperti Niagahoster atau Domainesia.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="undangan-kami.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-w-0 flex-1"
            aria-label="Domain kustom"
          />
          <Button
            onClick={() => set.mutate({ invitationId, domain: input })}
            disabled={input.trim() === '' || set.isPending}
          >
            {set.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            Hubungkan
          </Button>
        </div>
      </div>
    );
  }

  const record = data.dnsRecord;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {data.verified ? (
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          ) : (
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{data.domain}</p>
            <p className="text-sm text-muted-foreground">
              {data.verified
                ? 'Aktif — undangan sudah bisa dibuka dari domain ini.'
                : 'Menunggu DNS. Tambahkan record di bawah, lalu tekan Periksa.'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {!data.verified && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => verify.mutate({ invitationId })}
              disabled={verify.isPending}
            >
              {verify.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Periksa
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => remove.mutate({ invitationId })}
            disabled={remove.isPending}
            aria-label={`Lepas domain ${data.domain}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!data.verified && record && (
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium">Tambahkan record ini di penyedia domain Anda:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-1 pr-4 font-medium">Type</th>
                  <th className="pb-1 pr-4 font-medium">Name</th>
                  <th className="pb-1 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono">
                  <td className="pr-4">{record.type}</td>
                  <td className="pr-4">{record.name}</td>
                  <td className="flex items-center gap-2 whitespace-nowrap">
                    {record.value}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(record.value);
                        toast.success('Value disalin');
                      }}
                      aria-label="Salin value record"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Perubahan DNS biasanya aktif dalam 10–60 menit, tapi bisa sampai 48 jam.
          </p>
        </div>
      )}

      {data.pending.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Verifikasi kepemilikan masih dibutuhkan:
          </p>
          <ul className="mt-1 space-y-0.5 font-mono text-xs text-amber-800 dark:text-amber-300">
            {data.pending.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
