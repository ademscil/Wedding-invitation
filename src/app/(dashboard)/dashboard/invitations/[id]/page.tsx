'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Users,
  Check,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemedUploadButton } from '@/components/ui/upload-button';
import { cn } from '@/lib/utils';

interface EventItem {
  name: string;
  date: string;
  time: string;
  location: string;
  mapUrl: string;
}

interface BankAccount {
  bank: string;
  accountName: string;
  accountNumber: string;
}

interface LoveStoryEntry {
  year: string;
  title: string;
  description: string;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-center justify-between p-6 text-left"
        onClick={() => setOpen(!open)}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {open ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="border-t pt-6">{children}</CardContent>
      )}
    </Card>
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
  const { data: templates, isLoading: templatesLoading } =
    trpc.template.list.useQuery();
  const utils = trpc.useUtils();

  // Form state
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [brideParents, setBrideParents] = useState('');
  const [groomParents, setGroomParents] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [quote, setQuote] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [streamingUrl, setStreamingUrl] = useState('');
  const [bridePhoto, setBridePhoto] = useState('');
  const [groomPhoto, setGroomPhoto] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loveStory, setLoveStory] = useState<LoveStoryEntry[]>([]);

  // Populate form when data loads
  useEffect(() => {
    if (invitation) {
      setBrideName(invitation.brideName || '');
      setGroomName(invitation.groomName || '');
      setSelectedTemplateId(invitation.templateId || null);
      setBrideParents(invitation.brideParents || '');
      setGroomParents(invitation.groomParents || '');
      setWeddingDate(
        invitation.weddingDate
          ? new Date(invitation.weddingDate).toISOString().split('T')[0]
          : ''
      );
      setQuote(invitation.quote || '');
      setDressCode(invitation.dressCode || '');
      setStreamingUrl(invitation.streamingUrl || '');
      setBridePhoto(invitation.bridePhoto || '');
      setGroomPhoto(invitation.groomPhoto || '');

      try {
        const settings = JSON.parse(invitation.settings || '{}');
        setMusicUrl(settings.musicUrl || '');
      } catch {
        setMusicUrl('');
      }
      try {
        setEvents(JSON.parse(invitation.events || '[]'));
      } catch {
        setEvents([]);
      }
      try {
        setBankAccounts(JSON.parse(invitation.bankAccounts || '[]'));
      } catch {
        setBankAccounts([]);
      }
      try {
        setGalleryImages(JSON.parse(invitation.galleryImages || '[]'));
      } catch {
        setGalleryImages([]);
      }
      try {
        setLoveStory(JSON.parse(invitation.loveStory || '[]'));
      } catch {
        setLoveStory([]);
      }
    }
  }, [invitation]);

  const updateMutation = trpc.invitation.update.useMutation({
    onSuccess: () => {
      toast.success('Undangan berhasil disimpan');
      utils.invitation.getById.invalidate({ id });
    },
    onError: () => {
      toast.error('Gagal menyimpan undangan');
    },
  });

  const statusMutation = trpc.invitation.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Status undangan diperbarui');
      utils.invitation.getById.invalidate({ id });
    },
    onError: () => {
      toast.error('Gagal mengubah status');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id,
      brideName,
      groomName,
      templateId: selectedTemplateId || undefined,
      brideParents: brideParents || undefined,
      groomParents: groomParents || undefined,
      weddingDate: weddingDate || undefined,
      quote: quote || undefined,
      dressCode: dressCode || undefined,
      streamingUrl: streamingUrl || undefined,
      bridePhoto: bridePhoto || undefined,
      groomPhoto: groomPhoto || undefined,
      settings: JSON.stringify({
        ...(invitation ? JSON.parse(invitation.settings || '{}') : {}),
        musicUrl: musicUrl || undefined,
      }),
      events: JSON.stringify(events),
      bankAccounts: JSON.stringify(bankAccounts),
      galleryImages: JSON.stringify(galleryImages),
      loveStory: JSON.stringify(loveStory),
    });
  };

  const handleTogglePublish = () => {
    if (!invitation) return;
    const newStatus =
      invitation.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleCopyLink = async () => {
    if (!invitation) return;
    const url = `${window.location.origin}/${invitation.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link berhasil disalin!');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  // Event helpers
  const addEvent = () =>
    setEvents([
      ...events,
      { name: '', date: '', time: '', location: '', mapUrl: '' },
    ]);
  const removeEvent = (index: number) =>
    setEvents(events.filter((_, i) => i !== index));
  const updateEvent = (index: number, field: keyof EventItem, value: string) =>
    setEvents(events.map((e, i) => (i === index ? { ...e, [field]: value } : e)));

  // Bank account helpers
  const addBankAccount = () =>
    setBankAccounts([
      ...bankAccounts,
      { bank: '', accountName: '', accountNumber: '' },
    ]);
  const removeBankAccount = (index: number) =>
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  const updateBankAccount = (
    index: number,
    field: keyof BankAccount,
    value: string
  ) =>
    setBankAccounts(
      bankAccounts.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );

  // Gallery helpers
  const addGalleryImage = () => setGalleryImages([...galleryImages, '']);
  const removeGalleryImage = (index: number) =>
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  const updateGalleryImage = (index: number, value: string) =>
    setGalleryImages(galleryImages.map((img, i) => (i === index ? value : img)));

  // Love story helpers
  const addLoveStoryEntry = () =>
    setLoveStory([...loveStory, { year: '', title: '', description: '' }]);
  const removeLoveStoryEntry = (index: number) =>
    setLoveStory(loveStory.filter((_, i) => i !== index));
  const updateLoveStoryEntry = (
    index: number,
    field: keyof LoveStoryEntry,
    value: string
  ) =>
    setLoveStory(
      loveStory.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );

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
        <Button variant="outline" onClick={() => router.push('/dashboard/invitations')}>
          Kembali ke Daftar Undangan
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {invitation.brideName && invitation.groomName
              ? `${invitation.brideName} & ${invitation.groomName}`
              : 'Edit Undangan'}
          </h1>
          <Badge
            variant={
              invitation.status === 'PUBLISHED' ? 'success' : 'secondary'
            }
            className="mt-1"
          >
            {invitation.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="mr-1.5 h-4 w-4" />
            Salin Link
          </Button>
          <Button
            variant={
              invitation.status === 'PUBLISHED' ? 'outline' : 'default'
            }
            size="sm"
            onClick={handleTogglePublish}
            disabled={statusMutation.isLoading}
          >
            {invitation.status === 'PUBLISHED' ? (
              <>
                <GlobeLock className="mr-1.5 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="mr-1.5 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Share link */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
            {typeof window !== 'undefined' ? window.location.origin : ''}
            /{invitation.slug}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        <Link
          href={`/dashboard/invitations/${id}`}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors',
            'bg-white shadow-sm'
          )}
        >
          Detail
        </Link>
        <Link
          href={`/dashboard/invitations/${id}/guests`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Users className="h-4 w-4" />
          Tamu ({invitation._count.guests})
        </Link>
      </div>

      {/* Detail Form */}
      <div className="space-y-4">
        {/* Couple Info */}
        <CollapsibleSection title="Data Mempelai" defaultOpen>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nama Mempelai Wanita"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
              />
              <Input
                label="Nama Mempelai Pria"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Orang Tua Mempelai Wanita"
                placeholder="Bapak ... & Ibu ..."
                value={brideParents}
                onChange={(e) => setBrideParents(e.target.value)}
              />
              <Input
                label="Orang Tua Mempelai Pria"
                placeholder="Bapak ... & Ibu ..."
                value={groomParents}
                onChange={(e) => setGroomParents(e.target.value)}
              />
            </div>
            <Input
              label="Tanggal Pernikahan"
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
            />
          </div>
        </CollapsibleSection>

        {/* Template */}
        <CollapsibleSection title="Template">
          {templatesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
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
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="relative h-28 bg-gradient-to-br from-primary/10 to-primary/5">
                    <div className="flex h-full items-center justify-center">
                      <Heart className="h-7 w-7 text-primary/30" />
                    </div>
                    {selectedTemplateId === template.id && (
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
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {template.category}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada template tersedia.
            </p>
          )}
        </CollapsibleSection>

        {/* Quote & Details */}
        <CollapsibleSection title="Kutipan & Detail">
          <div className="space-y-4">
            <Textarea
              label="Kutipan"
              placeholder="Dan di antara tanda-tanda kekuasaan-Nya ialah..."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Dress Code"
                placeholder="Contoh: Pastel / Formal"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
              />
              <Input
                label="Link Live Streaming"
                placeholder="https://..."
                value={streamingUrl}
                onChange={(e) => setStreamingUrl(e.target.value)}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Events */}
        <CollapsibleSection title="Acara">
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Acara {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeEvent(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Nama acara (Akad Nikah, Resepsi, dll)"
                  value={event.name}
                  onChange={(e) => updateEvent(index, 'name', e.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="date"
                    value={event.date}
                    onChange={(e) =>
                      updateEvent(index, 'date', e.target.value)
                    }
                  />
                  <Input
                    type="time"
                    value={event.time}
                    onChange={(e) =>
                      updateEvent(index, 'time', e.target.value)
                    }
                  />
                </div>
                <Input
                  placeholder="Lokasi acara"
                  value={event.location}
                  onChange={(e) =>
                    updateEvent(index, 'location', e.target.value)
                  }
                />
                <Input
                  placeholder="Link Google Maps (opsional)"
                  value={event.mapUrl}
                  onChange={(e) =>
                    updateEvent(index, 'mapUrl', e.target.value)
                  }
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEvent}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Acara
            </Button>
          </div>
        </CollapsibleSection>

        {/* Bank Accounts */}
        <CollapsibleSection title="Rekening / Amplop Digital">
          <div className="space-y-4">
            {bankAccounts.map((account, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Rekening {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeBankAccount(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Nama Bank (BCA, Mandiri, dll)"
                  value={account.bank}
                  onChange={(e) =>
                    updateBankAccount(index, 'bank', e.target.value)
                  }
                />
                <Input
                  placeholder="Nama Pemilik Rekening"
                  value={account.accountName}
                  onChange={(e) =>
                    updateBankAccount(index, 'accountName', e.target.value)
                  }
                />
                <Input
                  placeholder="Nomor Rekening"
                  value={account.accountNumber}
                  onChange={(e) =>
                    updateBankAccount(index, 'accountNumber', e.target.value)
                  }
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addBankAccount}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Rekening
            </Button>
          </div>
        </CollapsibleSection>

        {/* Gallery */}
        <CollapsibleSection title="Galeri Foto">
          <div className="space-y-4">
            {galleryImages.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="URL gambar"
                  value={url}
                  onChange={(e) => updateGalleryImage(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeGalleryImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={addGalleryImage}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah URL Manual
              </Button>
              <ThemedUploadButton
                label="Upload Foto"
                endpoint="invitationImage"
                onClientUploadComplete={(res) => {
                  const urls = res.map((file) => file.url);
                  setGalleryImages([...galleryImages, ...urls]);
                  toast.success('Foto berhasil diunggah');
                }}
                onUploadError={(error) => {
                  toast.error(`Upload gagal: ${error.message}`);
                }}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Photo & Music */}
        <CollapsibleSection title="Foto & Musik">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Foto Mempelai Wanita</label>
                {bridePhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bridePhoto} alt="Foto mempelai wanita" className="h-32 w-32 rounded-lg object-cover" />
                )}
                <ThemedUploadButton
                  label="Upload Foto"
                  endpoint="invitationImage"
                  onClientUploadComplete={(res) => {
                    setBridePhoto(res[0]?.url ?? '');
                    toast.success('Foto berhasil diunggah');
                  }}
                  onUploadError={(error) => {
                    toast.error(`Upload gagal: ${error.message}`);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Foto Mempelai Pria</label>
                {groomPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={groomPhoto} alt="Foto mempelai pria" className="h-32 w-32 rounded-lg object-cover" />
                )}
                <ThemedUploadButton
                  label="Upload Foto"
                  endpoint="invitationImage"
                  onClientUploadComplete={(res) => {
                    setGroomPhoto(res[0]?.url ?? '');
                    toast.success('Foto berhasil diunggah');
                  }}
                  onUploadError={(error) => {
                    toast.error(`Upload gagal: ${error.message}`);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Musik Latar</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="URL musik (mp3)"
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  className="flex-1"
                />
                <ThemedUploadButton
                  label="Upload Musik"
                  endpoint="invitationMusic"
                  onClientUploadComplete={(res) => {
                    setMusicUrl(res[0]?.url ?? '');
                    toast.success('Musik berhasil diunggah');
                  }}
                  onUploadError={(error) => {
                    toast.error(`Upload gagal: ${error.message}`);
                  }}
                />
              </div>
              {musicUrl && (
                <audio controls src={musicUrl} className="mt-2 w-full">
                  <track kind="captions" />
                </audio>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Love Story */}
        <CollapsibleSection title="Love Story">
          <div className="space-y-4">
            {loveStory.map((entry, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Cerita {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeLoveStoryEntry(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Tahun"
                    value={entry.year}
                    onChange={(e) =>
                      updateLoveStoryEntry(index, 'year', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Judul"
                    value={entry.title}
                    onChange={(e) =>
                      updateLoveStoryEntry(index, 'title', e.target.value)
                    }
                  />
                </div>
                <Textarea
                  placeholder="Ceritakan kisah cinta kalian..."
                  value={entry.description}
                  onChange={(e) =>
                    updateLoveStoryEntry(index, 'description', e.target.value)
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addLoveStoryEntry}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Cerita
            </Button>
          </div>
        </CollapsibleSection>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={updateMutation.isLoading}
          className="shadow-lg"
        >
          {updateMutation.isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
