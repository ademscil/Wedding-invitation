'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Heart, Loader2, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { generateSlug, cn } from '@/lib/utils';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';

export default function NewInvitationPage() {
  const router = useRouter();

  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const { data: templates, isLoading: templatesLoading } = trpc.template.list.useQuery();
  const { data: subscription } = trpc.payment.getSubscription.useQuery();

  const isFreeTier = (subscription?.tier ?? 'FREE') === 'FREE';

  const createMutation = trpc.invitation.create.useMutation({
    onSuccess: (data) => {
      toast.success('Undangan berhasil dibuat');
      router.push(`/dashboard/invitations/${data.id}`);
    },
    onError: (error) => {
      if (error.data?.code === 'FORBIDDEN') {
        setQuotaError(error.message);
      } else {
        toast.error(error.message || 'Gagal membuat undangan');
      }
    },
  });

  const slug = brideName && groomName ? generateSlug(brideName, groomName) : '';

  const visibleTemplates = templates?.filter(
    (template) => !category || template.category === category
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuotaError(null);

    if (!brideName.trim() || !groomName.trim()) {
      toast.error('Nama mempelai wajib diisi');
      return;
    }

    createMutation.mutate({
      brideName: brideName.trim(),
      groomName: groomName.trim(),
      templateId: selectedTemplateId || undefined,
      slug: slug || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Buat Undangan Baru</h1>
        <p className="text-muted-foreground">
          Pilih template dan isi data mempelai untuk memulai
        </p>
      </div>

      {quotaError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-900">Batas paket tercapai</p>
            <p className="mt-0.5 text-amber-800">{quotaError}</p>
            <Button size="sm" className="mt-3" asChild>
              <Link href="/dashboard/upgrade">Lihat Paket</Link>
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Template selection */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Pilih Template</h2>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategory('')}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  category === '' ? 'border-primary bg-primary/10 text-primary' : ''
                )}
              >
                Semua
              </button>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    category === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : ''
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {templatesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : visibleTemplates && visibleTemplates.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTemplates.map((template) => {
                const locked = template.isPremium && isFreeTier;
                const selected = selectedTemplateId === template.id;

                return (
                  <Card
                    key={template.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-disabled={locked}
                    className={cn(
                      'overflow-hidden transition-all',
                      locked
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:shadow-md',
                      selected && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => {
                      if (locked) {
                        toast.error(
                          'Template ini khusus paket berbayar. Upgrade untuk menggunakannya.'
                        );
                        return;
                      }
                      setSelectedTemplateId(selected ? null : template.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!locked) setSelectedTemplateId(selected ? null : template.id);
                      }
                    }}
                  >
                    <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="flex h-full items-center justify-center">
                        {locked ? (
                          <Lock className="h-8 w-8 text-primary/30" />
                        ) : (
                          <Heart className="h-8 w-8 text-primary/30" />
                        )}
                      </div>
                      {selected && (
                        <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {template.isPremium && (
                        <div className="absolute left-2 top-2">
                          <Badge variant="accent" className="text-xs">
                            Premium
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {category
                ? 'Tidak ada template pada kategori ini.'
                : 'Belum ada template tersedia. Undangan akan dibuat tanpa template.'}
            </p>
          )}

          {isFreeTier && templates?.some((t) => t.isPremium) && (
            <p className="text-xs text-muted-foreground">
              Template premium terkunci pada paket Gratis.{' '}
              <Link href="/dashboard/upgrade" className="text-primary underline">
                Lihat paket berbayar
              </Link>
            </p>
          )}
        </div>

        {/* Names */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Data Mempelai</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nama Mempelai Wanita"
              placeholder="Contoh: Siti Aisyah"
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              required
            />
            <Input
              label="Nama Mempelai Pria"
              placeholder="Contoh: Ahmad Rizky"
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              required
            />
          </div>
          {slug && (
            <p className="text-sm text-muted-foreground">
              Link undangan:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {typeof window !== 'undefined' ? window.location.host : ''}/{slug}
              </code>
              <span className="ml-1 text-xs">(bisa diubah nanti)</span>
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={createMutation.isLoading}>
            {createMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Undangan
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
