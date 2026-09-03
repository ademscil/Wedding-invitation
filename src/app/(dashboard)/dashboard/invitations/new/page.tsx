'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Heart, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { generateSlug } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function NewInvitationPage() {
  const router = useRouter();
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [targetedTemplate, setTargetedTemplate] = useState<{ id: string; name: string } | null>(null);

  const { data: subscription } = trpc.payment.getSubscription.useQuery();
  const isFree = !subscription || subscription.tier === 'FREE';

  const { data: templates, isLoading: templatesLoading } =
    trpc.template.list.useQuery();

  const createMutation = trpc.invitation.create.useMutation({
    onSuccess: (data) => {
      toast.success('Undangan berhasil dibuat!');
      router.push(`/dashboard/invitations/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal membuat undangan');
    },
  });

  const slug = brideName && groomName ? generateSlug(brideName, groomName) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <h1 className="text-xl font-bold sm:text-2xl">Buat Undangan Baru</h1>
        <p className="text-muted-foreground">
          Pilih template dan isi data mempelai untuk memulai
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Template Selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pilih Template</h2>
          {templatesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    'cursor-pointer overflow-hidden transition-all hover:shadow-md',
                    selectedTemplateId === template.id &&
                      'ring-2 ring-primary ring-offset-2'
                  )}
                  onClick={() => {
                    if (template.isPremium && isFree) {
                      setTargetedTemplate(template);
                      setUpgradeDialogOpen(true);
                      return;
                    }
                    setSelectedTemplateId(
                      selectedTemplateId === template.id
                        ? null
                        : template.id
                    );
                  }}
                >
                  <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5">
                    {template.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Heart className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                    {selectedTemplateId === template.id && (
                      <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {template.isPremium && (
                      <div className="absolute left-2 top-2">
                        <Badge
                          variant={isFree ? 'secondary' : 'accent'}
                          className="flex items-center gap-1 text-xs"
                        >
                          {isFree && <Lock className="h-3 w-3 text-amber-600" />}
                          Premium
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {template.category}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada template tersedia. Undangan akan dibuat tanpa template.
            </p>
          )}
        </div>

        {/* Names */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Data Mempelai</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Groom before bride, the order an Indonesian invitation uses. */}
            <Input
              label="Nama Mempelai Pria"
              placeholder="Contoh: Ahmad Rizky"
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              required
            />
            <Input
              label="Nama Mempelai Wanita"
              placeholder="Contoh: Siti Aisyah"
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              required
            />
          </div>
          {slug && (
            <p className="text-sm text-muted-foreground">
              Link undangan:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {typeof window !== 'undefined' ? window.location.origin : ''}
                /{slug}
              </code>
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Buat Undangan
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Batal
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        title="Template Khusus Paket Berbayar"
        description={`Template "${targetedTemplate?.name}" hanya tersedia untuk paket Starter ke atas. Ingin upgrade paket sekarang untuk menikmati template ini beserta fitur eksklusif lainnya?`}
        confirmLabel="Lihat Pilihan Paket"
        cancelLabel="Pilih Template Lain"
        variant="default"
        onConfirm={() => router.push('/dashboard/upgrade')}
      />
    </div>
  );
}
