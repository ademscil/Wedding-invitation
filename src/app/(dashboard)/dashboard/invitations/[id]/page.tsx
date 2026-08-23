'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  Copy,
  Globe,
  GlobeLock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Check,
  AlertCircle,
  Palette,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BANKS } from '@/lib/constants';
import { InvitationTabs } from '@/components/dashboard/invitation-tabs';
import {
  parseEvents,
  parseBankAccounts,
  parseGalleryImages,
  parseLoveStory,
  parseSettings,
} from '@/lib/invitation-data';
import type {
  BankAccount,
  GalleryImage,
  InvitationEvent,
  InvitationSettings,
  LoveStoryEntry,
} from '@/types';

/** Stable client-side id for newly added rows. */
function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

const SECTION_TOGGLES: { key: keyof InvitationSettings; label: string }[] = [
  { key: 'showCountdown', label: 'Hitung mundur' },
  { key: 'showLoveStory', label: 'Love story' },
  { key: 'showGallery', label: 'Galeri foto' },
  { key: 'showRsvp', label: 'Form RSVP' },
  { key: 'showGift', label: 'Amplop digital' },
  { key: 'showGuestbook', label: 'Buku tamu' },
  { key: 'showDressCode', label: 'Dress code' },
  { key: 'showStreaming', label: 'Live streaming' },
];

function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-6 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {badge && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && <CardContent className="border-t pt-6">{children}</CardContent>}
    </Card>
  );
}

function RepeaterItem({
  label,
  onRemove,
  children,
}: {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
          aria-label={`Hapus ${label}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}

export default function InvitationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: invitation, isLoading } = trpc.invitation.getById.useQuery(
    { id },
    { enabled: !!id }
  );
  const { data: templates } = trpc.template.list.useQuery();
  const utils = trpc.useUtils();

  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [brideParents, setBrideParents] = useState('');
  const [groomParents, setGroomParents] = useState('');
  const [bridePhoto, setBridePhoto] = useState('');
  const [groomPhoto, setGroomPhoto] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [quote, setQuote] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [streamingUrl, setStreamingUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [events, setEvents] = useState<InvitationEvent[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loveStory, setLoveStory] = useState<LoveStoryEntry[]>([]);
  const [settings, setSettings] = useState<InvitationSettings>({});
  const [isDirty, setIsDirty] = useState(false);

  // Hydrate the form once the invitation arrives.
  useEffect(() => {
    if (!invitation) return;

    setBrideName(invitation.brideName || '');
    setGroomName(invitation.groomName || '');
    setBrideParents(invitation.brideParents || '');
    setGroomParents(invitation.groomParents || '');
    setBridePhoto(invitation.bridePhoto || '');
    setGroomPhoto(invitation.groomPhoto || '');
    setWeddingDate(
      invitation.weddingDate
        ? new Date(invitation.weddingDate).toISOString().split('T')[0]
        : ''
    );
    setQuote(invitation.quote || '');
    setDressCode(invitation.dressCode || '');
    setStreamingUrl(invitation.streamingUrl || '');
    setSlug(invitation.slug);
    setTemplateId(invitation.templateId || '');
    setEvents(parseEvents(invitation.events));
    setBankAccounts(parseBankAccounts(invitation.bankAccounts));
    setGalleryImages(parseGalleryImages(invitation.galleryImages));
    setLoveStory(parseLoveStory(invitation.loveStory));
    setSettings(parseSettings(invitation.settings));
    setIsDirty(false);
  }, [invitation]);

  // Warn before losing edits on a full page unload.
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /** Wraps a state setter so any edit marks the form dirty. */
  const track = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: React.SetStateAction<T>) => {
        setIsDirty(true);
        setter(value);
      },
    []
  );

  const updateMutation = trpc.invitation.update.useMutation({
    onSuccess: () => {
      toast.success('Undangan berhasil disimpan');
      setIsDirty(false);
      utils.invitation.getById.invalidate({ id });
      utils.invitation.list.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Gagal menyimpan undangan'),
  });

  const statusMutation = trpc.invitation.updateStatus.useMutation({
    onSuccess: (updated) => {
      toast.success(
        updated.status === 'PUBLISHED'
          ? 'Undangan sudah tayang dan bisa dibagikan'
          : 'Undangan dikembalikan ke draft'
      );
      utils.invitation.getById.invalidate({ id });
      utils.invitation.list.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Gagal mengubah status'),
  });

  const publicUrl = useMemo(
    () => (typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`),
    [slug]
  );

  // What still blocks publishing, mirrored from the server-side check.
  const missingForPublish = useMemo(() => {
    const missing: string[] = [];
    if (!brideName.trim()) missing.push('nama mempelai wanita');
    if (!groomName.trim()) missing.push('nama mempelai pria');
    if (!weddingDate) missing.push('tanggal pernikahan');
    if (events.length === 0) missing.push('minimal 1 acara');
    return missing;
  }, [brideName, groomName, weddingDate, events.length]);

  const handleSave = () => {
    updateMutation.mutate({
      id,
      brideName,
      groomName,
      brideParents: brideParents || undefined,
      groomParents: groomParents || undefined,
      bridePhoto: bridePhoto || undefined,
      groomPhoto: groomPhoto || undefined,
      weddingDate: weddingDate || undefined,
      quote: quote || undefined,
      dressCode: dressCode || undefined,
      streamingUrl: streamingUrl || undefined,
      templateId: templateId || undefined,
      ...(invitation && slug !== invitation.slug && { slug }),
      events: JSON.stringify(events),
      bankAccounts: JSON.stringify(bankAccounts),
      galleryImages: JSON.stringify(galleryImages),
      loveStory: JSON.stringify(loveStory),
      settings: JSON.stringify(settings),
    });
  };

  const handleTogglePublish = () => {
    if (!invitation) return;

    if (invitation.status !== 'PUBLISHED' && isDirty) {
      toast.error('Simpan perubahan dulu sebelum menayangkan undangan');
      return;
    }

    statusMutation.mutate({
      id,
      status: invitation.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link berhasil disalin');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const updateSetting = <K extends keyof InvitationSettings>(
    key: K,
    value: InvitationSettings[K]
  ) => {
    setIsDirty(true);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="mb-2 text-xl font-semibold">Undangan tidak ditemukan</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Undangan mungkin sudah dihapus atau bukan milik akun ini.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/invitations')}>
          Kembali ke Daftar Undangan
        </Button>
      </div>
    );
  }

  const isPublished = invitation.status === 'PUBLISHED';

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {brideName && groomName ? `${brideName} & ${groomName}` : 'Edit Undangan'}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={isPublished ? 'success' : 'secondary'}>
              {isPublished ? 'Tayang' : 'Draft'}
            </Badge>
            {isDirty && (
              <span className="text-xs text-amber-600">Ada perubahan belum disimpan</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPublished && (
            <Button variant="outline" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Lihat
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="mr-1.5 h-4 w-4" />
            Salin Link
          </Button>
          <Button
            variant={isPublished ? 'outline' : 'default'}
            size="sm"
            onClick={handleTogglePublish}
            disabled={statusMutation.isLoading}
          >
            {statusMutation.isLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : isPublished ? (
              <GlobeLock className="mr-1.5 h-4 w-4" />
            ) : (
              <Globe className="mr-1.5 h-4 w-4" />
            )}
            {isPublished ? 'Jadikan Draft' : 'Tayangkan'}
          </Button>
        </div>
      </div>

      {/* Publish readiness */}
      {!isPublished && missingForPublish.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Lengkapi sebelum menayangkan</p>
            <p className="mt-0.5 text-amber-800">{missingForPublish.join(', ')}.</p>
          </div>
        </div>
      )}

      {/* Share link */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
            {publicUrl}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopyLink} aria-label="Salin link">
            <Copy className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <InvitationTabs invitationId={id} active="detail" guestCount={invitation._count.guests} />

      <div className="space-y-4">
        {/* Couple */}
        <CollapsibleSection title="Data Mempelai" defaultOpen>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nama Mempelai Wanita"
                value={brideName}
                onChange={(e) => track(setBrideName)(e.target.value)}
              />
              <Input
                label="Nama Mempelai Pria"
                value={groomName}
                onChange={(e) => track(setGroomName)(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Orang Tua Mempelai Wanita"
                placeholder="Bapak ... & Ibu ..."
                value={brideParents}
                onChange={(e) => track(setBrideParents)(e.target.value)}
              />
              <Input
                label="Orang Tua Mempelai Pria"
                placeholder="Bapak ... & Ibu ..."
                value={groomParents}
                onChange={(e) => track(setGroomParents)(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Foto Mempelai Wanita (URL)"
                placeholder="https://..."
                value={bridePhoto}
                onChange={(e) => track(setBridePhoto)(e.target.value)}
              />
              <Input
                label="Foto Mempelai Pria (URL)"
                placeholder="https://..."
                value={groomPhoto}
                onChange={(e) => track(setGroomPhoto)(e.target.value)}
              />
            </div>
            <Input
              label="Tanggal Pernikahan"
              type="date"
              value={weddingDate}
              onChange={(e) => track(setWeddingDate)(e.target.value)}
            />
          </div>
        </CollapsibleSection>

        {/* Events */}
        <CollapsibleSection
          title="Acara"
          description="Akad, resepsi, atau acara lain beserta lokasinya"
          badge={`${events.length}`}
          defaultOpen={events.length === 0}
        >
          <div className="space-y-4">
            {events.map((event, index) => (
              <RepeaterItem
                key={event.id}
                label={event.name || `Acara ${index + 1}`}
                onRemove={() => track(setEvents)(events.filter((_, i) => i !== index))}
              >
                <Input
                  label="Nama acara"
                  placeholder="Akad Nikah / Resepsi"
                  value={event.name}
                  onChange={(e) =>
                    track(setEvents)(
                      events.map((v, i) => (i === index ? { ...v, name: e.target.value } : v))
                    )
                  }
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Tanggal"
                    type="date"
                    value={event.date}
                    onChange={(e) =>
                      track(setEvents)(
                        events.map((v, i) => (i === index ? { ...v, date: e.target.value } : v))
                      )
                    }
                  />
                  <Input
                    label="Mulai"
                    type="time"
                    value={event.startTime}
                    onChange={(e) =>
                      track(setEvents)(
                        events.map((v, i) =>
                          i === index ? { ...v, startTime: e.target.value } : v
                        )
                      )
                    }
                  />
                  <Input
                    label="Selesai"
                    type="time"
                    value={event.endTime ?? ''}
                    onChange={(e) =>
                      track(setEvents)(
                        events.map((v, i) =>
                          i === index ? { ...v, endTime: e.target.value || undefined } : v
                        )
                      )
                    }
                  />
                </div>
                <Input
                  label="Nama tempat"
                  placeholder="Gedung Serbaguna Melati"
                  value={event.venue}
                  onChange={(e) =>
                    track(setEvents)(
                      events.map((v, i) => (i === index ? { ...v, venue: e.target.value } : v))
                    )
                  }
                />
                <Input
                  label="Alamat lengkap"
                  placeholder="Jl. Mawar No. 1, Jakarta Selatan"
                  value={event.address}
                  onChange={(e) =>
                    track(setEvents)(
                      events.map((v, i) => (i === index ? { ...v, address: e.target.value } : v))
                    )
                  }
                />
                <Input
                  label="Link Google Maps (opsional)"
                  placeholder="https://maps.google.com/..."
                  value={event.mapUrl ?? ''}
                  onChange={(e) =>
                    track(setEvents)(
                      events.map((v, i) =>
                        i === index ? { ...v, mapUrl: e.target.value || undefined } : v
                      )
                    )
                  }
                />
              </RepeaterItem>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                track(setEvents)([
                  ...events,
                  {
                    id: newId('event'),
                    name: '',
                    date: weddingDate,
                    startTime: '',
                    endTime: undefined,
                    venue: '',
                    address: '',
                    mapUrl: undefined,
                  },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Acara
            </Button>
          </div>
        </CollapsibleSection>

        {/* Quote & details */}
        <CollapsibleSection title="Kutipan & Detail">
          <div className="space-y-4">
            <Textarea
              label="Kutipan"
              placeholder="Dan di antara tanda-tanda kekuasaan-Nya ialah..."
              value={quote}
              onChange={(e) => track(setQuote)(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Dress Code"
                placeholder="Pastel / Formal"
                value={dressCode}
                onChange={(e) => track(setDressCode)(e.target.value)}
              />
              <Input
                label="Link Live Streaming"
                placeholder="https://youtube.com/..."
                value={streamingUrl}
                onChange={(e) => track(setStreamingUrl)(e.target.value)}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Bank accounts */}
        <CollapsibleSection
          title="Rekening / Amplop Digital"
          description="Nomor rekening yang bisa disalin tamu"
          badge={`${bankAccounts.length}`}
        >
          <div className="space-y-4">
            {bankAccounts.map((account, index) => (
              <RepeaterItem
                key={account.id}
                label={account.bankName || `Rekening ${index + 1}`}
                onRemove={() =>
                  track(setBankAccounts)(bankAccounts.filter((_, i) => i !== index))
                }
              >
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium">Bank</label>
                  <input
                    list="bank-options"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="BCA, Mandiri, GoPay, ..."
                    value={account.bankName}
                    onChange={(e) =>
                      track(setBankAccounts)(
                        bankAccounts.map((v, i) =>
                          i === index ? { ...v, bankName: e.target.value } : v
                        )
                      )
                    }
                  />
                </div>
                <Input
                  label="Nama pemilik rekening"
                  value={account.accountHolder}
                  onChange={(e) =>
                    track(setBankAccounts)(
                      bankAccounts.map((v, i) =>
                        i === index ? { ...v, accountHolder: e.target.value } : v
                      )
                    )
                  }
                />
                <Input
                  label="Nomor rekening"
                  inputMode="numeric"
                  value={account.accountNumber}
                  onChange={(e) =>
                    track(setBankAccounts)(
                      bankAccounts.map((v, i) =>
                        i === index ? { ...v, accountNumber: e.target.value } : v
                      )
                    )
                  }
                />
              </RepeaterItem>
            ))}
            <datalist id="bank-options">
              {BANKS.map((bank) => (
                <option key={bank.code} value={bank.name} />
              ))}
            </datalist>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                track(setBankAccounts)([
                  ...bankAccounts,
                  { id: newId('bank'), bankName: '', accountHolder: '', accountNumber: '' },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Rekening
            </Button>
          </div>
        </CollapsibleSection>

        {/* Gallery */}
        <CollapsibleSection
          title="Galeri Foto"
          description="Tempel URL foto — bisa dari Google Drive, Imgur, atau hosting lain"
          badge={`${galleryImages.length}`}
        >
          <div className="space-y-4">
            {galleryImages.map((image, index) => (
              <RepeaterItem
                key={image.id}
                label={`Foto ${index + 1}`}
                onRemove={() =>
                  track(setGalleryImages)(galleryImages.filter((_, i) => i !== index))
                }
              >
                <Input
                  label="URL gambar"
                  placeholder="https://..."
                  value={image.url}
                  onChange={(e) =>
                    track(setGalleryImages)(
                      galleryImages.map((v, i) =>
                        i === index ? { ...v, url: e.target.value } : v
                      )
                    )
                  }
                />
                <Input
                  label="Keterangan (opsional)"
                  value={image.caption ?? ''}
                  onChange={(e) =>
                    track(setGalleryImages)(
                      galleryImages.map((v, i) =>
                        i === index ? { ...v, caption: e.target.value || undefined } : v
                      )
                    )
                  }
                />
                {image.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={image.caption || `Pratinjau foto ${index + 1}`}
                    className="h-24 w-24 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </RepeaterItem>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                track(setGalleryImages)([
                  ...galleryImages,
                  { id: newId('image'), url: '', caption: undefined },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Foto
            </Button>
          </div>
        </CollapsibleSection>

        {/* Love story */}
        <CollapsibleSection
          title="Love Story"
          description="Perjalanan kisah kalian dalam bentuk timeline"
          badge={`${loveStory.length}`}
        >
          <div className="space-y-4">
            {loveStory.map((entry, index) => (
              <RepeaterItem
                key={entry.id}
                label={entry.title || `Cerita ${index + 1}`}
                onRemove={() => track(setLoveStory)(loveStory.filter((_, i) => i !== index))}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Tahun"
                    placeholder="2021"
                    value={entry.year}
                    onChange={(e) =>
                      track(setLoveStory)(
                        loveStory.map((v, i) =>
                          i === index ? { ...v, year: e.target.value } : v
                        )
                      )
                    }
                  />
                  <Input
                    label="Judul"
                    placeholder="Pertama Bertemu"
                    value={entry.title}
                    onChange={(e) =>
                      track(setLoveStory)(
                        loveStory.map((v, i) =>
                          i === index ? { ...v, title: e.target.value } : v
                        )
                      )
                    }
                  />
                </div>
                <Textarea
                  label="Cerita"
                  placeholder="Ceritakan momen ini..."
                  value={entry.description}
                  onChange={(e) =>
                    track(setLoveStory)(
                      loveStory.map((v, i) =>
                        i === index ? { ...v, description: e.target.value } : v
                      )
                    )
                  }
                />
                <Input
                  label="Foto (URL, opsional)"
                  placeholder="https://..."
                  value={entry.image ?? ''}
                  onChange={(e) =>
                    track(setLoveStory)(
                      loveStory.map((v, i) =>
                        i === index ? { ...v, image: e.target.value || undefined } : v
                      )
                    )
                  }
                />
              </RepeaterItem>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                track(setLoveStory)([
                  ...loveStory,
                  {
                    id: newId('story'),
                    year: '',
                    title: '',
                    description: '',
                    image: undefined,
                  },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Cerita
            </Button>
          </div>
        </CollapsibleSection>

        {/* Appearance */}
        <CollapsibleSection
          title="Tampilan & Tema"
          description="Template, warna, musik, dan bagian yang ditampilkan"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Palette className="h-4 w-4" />
                Template
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {templates?.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setTemplateId(template.id);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors',
                      templateId === template.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/40'
                    )}
                  >
                    <span>
                      <span className="font-medium">{template.name}</span>
                      {template.isPremium && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                          Premium
                        </span>
                      )}
                    </span>
                    {templateId === template.id && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Warna Utama</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded border"
                    value={settings.primaryColor || '#8B6F5C'}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                  />
                  <Input
                    value={settings.primaryColor || ''}
                    placeholder="Bawaan template"
                    onChange={(e) => updateSetting('primaryColor', e.target.value || undefined)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Warna Aksen</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded border"
                    value={settings.secondaryColor || '#D4A574'}
                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                  />
                  <Input
                    value={settings.secondaryColor || ''}
                    placeholder="Bawaan template"
                    onChange={(e) =>
                      updateSetting('secondaryColor', e.target.value || undefined)
                    }
                  />
                </div>
              </div>
            </div>

            <Input
              label="Musik Latar (URL mp3)"
              placeholder="https://.../lagu.mp3"
              value={settings.musicUrl || ''}
              onChange={(e) => updateSetting('musicUrl', e.target.value || undefined)}
            />

            <div>
              <p className="mb-2 text-sm font-medium">Bagian yang Ditampilkan</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SECTION_TOGGLES.map((toggle) => {
                  const enabled = settings[toggle.key] !== false;
                  return (
                    <label
                      key={toggle.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={enabled}
                        onChange={(e) =>
                          updateSetting(
                            toggle.key,
                            e.target.checked ? undefined : (false as never)
                          )
                        }
                      />
                      {toggle.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Link */}
        <CollapsibleSection
          title="Link Undangan"
          description="Alamat yang dibagikan ke tamu"
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Link2 className="h-4 w-4" />
                Alamat undangan
              </label>
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-sm text-muted-foreground">
                  {typeof window !== 'undefined' ? window.location.host : ''}/
                </span>
                <Input
                  value={slug}
                  onChange={(e) =>
                    track(setSlug)(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    )
                  }
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Huruf kecil, angka, dan tanda hubung. Mengubah link membuat link lama
                tidak berlaku.
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={updateMutation.isLoading || !isDirty}
          className="shadow-lg"
        >
          {updateMutation.isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isDirty ? 'Simpan Perubahan' : 'Tersimpan'}
        </Button>
      </div>
    </div>
  );
}
