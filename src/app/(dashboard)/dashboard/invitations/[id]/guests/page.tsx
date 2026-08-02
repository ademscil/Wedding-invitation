'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  HelpCircle,
  Clock,
  Trash2,
  Loader2,
  X,
  Upload,
  Download,
  MessageCircle,
  QrCode,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { RSVP_STATUS, GUEST_GROUPS } from '@/lib/constants';
import {
  parseGuestFile,
  exportGuestsToCsv,
  exportGuestsToExcel,
  generateWhatsAppLink,
  generateGuestQrCode,
  downloadImportTemplate,
} from '@/lib/guest-utils';

export default function GuestsPage() {
  const params = useParams();
  const id = params.id as string;

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showQrModal, setShowQrModal] = useState<{ name: string; qr: string } | null>(null);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestGroup, setNewGuestGroup] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Array<{ name: string; phone?: string; email?: string; groupName?: string }>>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: invitation } = trpc.invitation.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const { data: guests, isLoading: guestsLoading } = trpc.guest.list.useQuery(
    { invitationId: id, status: statusFilter || undefined },
    { enabled: !!id }
  );

  const { data: stats, isLoading: statsLoading } = trpc.guest.getStats.useQuery(
    { invitationId: id },
    { enabled: !!id }
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.guest.create.useMutation({
    onSuccess: () => {
      toast.success('Tamu berhasil ditambahkan');
      utils.guest.list.invalidate({ invitationId: id });
      utils.guest.getStats.invalidate({ invitationId: id });
      setShowAddDialog(false);
      setNewGuestName('');
      setNewGuestPhone('');
      setNewGuestGroup('');
    },
    onError: () => toast.error('Gagal menambahkan tamu'),
  });

  const createManyMutation = trpc.guest.createMany.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.count} tamu berhasil diimpor`);
      utils.guest.list.invalidate({ invitationId: id });
      utils.guest.getStats.invalidate({ invitationId: id });
      setShowImportDialog(false);
      setImportFile(null);
      setImportPreview([]);
    },
    onError: () => toast.error('Gagal mengimpor tamu'),
  });

  const deleteMutation = trpc.guest.delete.useMutation({
    onSuccess: () => {
      toast.success('Tamu berhasil dihapus');
      utils.guest.list.invalidate({ invitationId: id });
      utils.guest.getStats.invalidate({ invitationId: id });
    },
    onError: () => toast.error('Gagal menghapus tamu'),
  });

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) {
      toast.error('Nama tamu wajib diisi');
      return;
    }
    createMutation.mutate({
      invitationId: id,
      name: newGuestName.trim(),
      phone: newGuestPhone.trim() || undefined,
      groupName: newGuestGroup || undefined,
    });
  };

  const handleDeleteGuest = (guestId: string) => {
    if (window.confirm('Yakin ingin menghapus tamu ini?')) {
      deleteMutation.mutate({ id: guestId });
    }
  };

  const handleFileSelect = async (file: File) => {
    setImportFile(file);
    setImportLoading(true);
    try {
      const rows = await parseGuestFile(file);
      setImportPreview(rows.slice(0, 5));
      toast.success(`${rows.length} tamu siap diimpor`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membaca file');
      setImportFile(null);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const rows = await parseGuestFile(importFile);
      createManyMutation.mutate({ invitationId: id, guests: rows });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengimpor');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!guests?.length) return toast.error('Tidak ada tamu untuk diekspor');
    exportGuestsToCsv(
      guests.map((g) => ({
        name: g.name,
        phone: g.phone,
        email: g.email,
        groupName: g.groupName,
        rsvpStatus: g.rsvpStatus,
        rsvpGuestCount: g.rsvpGuestCount,
        personalLink: g.personalLink,
        linkOpenedAt: g.linkOpenedAt ? new Date(g.linkOpenedAt) : null,
        checkedIn: g.checkedIn,
      }))
    );
    toast.success('File CSV berhasil diunduh');
  };

  const handleExportExcel = () => {
    if (!guests?.length) return toast.error('Tidak ada tamu untuk diekspor');
    exportGuestsToExcel(
      guests.map((g) => ({
        name: g.name,
        phone: g.phone,
        email: g.email,
        groupName: g.groupName,
        rsvpStatus: g.rsvpStatus,
        rsvpGuestCount: g.rsvpGuestCount,
        personalLink: g.personalLink,
        linkOpenedAt: g.linkOpenedAt ? new Date(g.linkOpenedAt) : null,
        checkedIn: g.checkedIn,
      }))
    );
    toast.success('File Excel berhasil diunduh');
  };

  const handleWhatsApp = (guestName: string, phone: string, personalLink: string) => {
    if (!phone) return toast.error('Nomor HP tamu tidak tersedia');
    const baseUrl = window.location.origin;
    const invitationUrl = `${baseUrl}/${invitation?.slug}/to/${personalLink}`;
    const link = generateWhatsAppLink(
      guestName,
      phone,
      invitationUrl,
      invitation?.brideName || 'Mempelai Wanita',
      invitation?.groomName || 'Mempelai Pria'
    );
    window.open(link, '_blank');
  };

  const handleShowQr = async (guestName: string, personalLink: string) => {
    try {
      const baseUrl = window.location.origin;
      const qrDataUrl = await generateGuestQrCode(personalLink, `${baseUrl}/${invitation?.slug}`);
      setShowQrModal({ name: guestName, qr: qrDataUrl });
    } catch {
      toast.error('Gagal membuat QR code');
    }
  };

  const handleCopyLink = (personalLink: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${invitation?.slug}/to/${personalLink}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link disalin'));
  };

  const statusFilters = [
    { value: '', label: 'Semua', icon: Users },
    { value: 'ATTENDING', label: 'Hadir', icon: UserCheck },
    { value: 'NOT_ATTENDING', label: 'Tidak Hadir', icon: UserX },
    { value: 'MAYBE', label: 'Mungkin', icon: HelpCircle },
    { value: 'PENDING', label: 'Menunggu', icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daftar Tamu</h1>
          <p className="text-muted-foreground">Kelola tamu undangan Anda</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadImportTemplate}>
            <Download className="mr-1.5 h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="mr-1.5 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Tamu
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        <Link
          href={`/dashboard/invitations/${id}`}
          className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Detail
        </Link>
        <Link
          href={`/dashboard/invitations/${id}/guests`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-4 py-2 text-center text-sm font-medium shadow-sm transition-colors"
        >
          <Users className="h-4 w-4" />
          Tamu
        </Link>
      </div>

      {/* Stats Bar */}
      {statsLoading ? (
        <div className="grid gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { label: 'Total', value: stats.total, color: '' },
            { label: 'Hadir', value: stats.attending, color: 'text-green-600' },
            { label: 'Tidak Hadir', value: stats.notAttending, color: 'text-red-600' },
            { label: 'Mungkin', value: stats.maybe, color: 'text-blue-600' },
            { label: 'Menunggu', value: stats.pending, color: 'text-yellow-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const Icon = filter.icon;
          return (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {/* Guest Table */}
      {guestsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : guests && guests.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">No. HP</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Grup</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Link</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const rsvpConfig = RSVP_STATUS[guest.rsvpStatus as keyof typeof RSVP_STATUS] || RSVP_STATUS.PENDING;
                  return (
                    <tr key={guest.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{guest.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{guest.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{guest.groupName || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', rsvpConfig.color)}>
                          {rsvpConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyLink(guest.personalLink)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Salin link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleShowQr(guest.name, guest.personalLink)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="QR Code"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>
                          {guest.linkOpenedAt && (
                            <span className="ml-1 text-xs text-green-600" title="Link sudah dibuka">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {guest.phone && (
                            <button
                              onClick={() => handleWhatsApp(guest.name, guest.phone!, guest.personalLink)}
                              className="rounded p-1 text-green-600 hover:bg-green-50"
                              title="Kirim via WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="rounded p-1 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteGuest(guest.id)}
                            disabled={deleteMutation.isLoading}
                            title="Hapus tamu"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-16">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Belum ada tamu</h3>
          <p className="mb-4 text-sm text-muted-foreground">Tambahkan tamu atau import dari file CSV/Excel</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import File
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Tamu
            </Button>
          </div>
        </div>
      )}

      {/* Add Guest Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tambah Tamu</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <Input
                label="Nama Tamu"
                placeholder="Nama lengkap tamu"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                required
              />
              <Input
                label="No. Handphone (opsional)"
                placeholder="08xxxxxxxxxx"
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
              />
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Grup (opsional)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newGuestGroup}
                  onChange={(e) => setNewGuestGroup(e.target.value)}
                >
                  <option value="">Pilih grup</option>
                  {GUEST_GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={createMutation.isLoading}>
                  {createMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tambah Tamu
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Import Tamu</h2>
              <Button variant="ghost" size="icon" onClick={() => { setShowImportDialog(false); setImportFile(null); setImportPreview([]); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="mb-3 text-sm text-muted-foreground">
              Upload file CSV atau Excel. Kolom yang didukung: <code className="rounded bg-muted px-1">nama</code>, <code className="rounded bg-muted px-1">no_hp</code>, <code className="rounded bg-muted px-1">email</code>, <code className="rounded bg-muted px-1">grup</code>.
            </p>

            <button
              onClick={downloadImportTemplate}
              className="mb-4 text-sm text-primary underline"
            >
              Unduh template CSV
            </button>

            <div
              className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 transition-colors hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{importFile ? importFile.name : 'Klik atau drag file ke sini'}</p>
              <p className="text-xs text-muted-foreground">CSV atau Excel (.xlsx)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
            </div>

            {importPreview.length > 0 && (
              <div className="mb-4 rounded-lg border">
                <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Preview (5 baris pertama)</p>
                <div className="divide-y">
                  {importPreview.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="font-medium">{row.name}</span>
                      {row.phone && <span className="text-muted-foreground">{row.phone}</span>}
                      {row.groupName && <span className="text-xs text-muted-foreground">[{row.groupName}]</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleImportConfirm}
                disabled={!importFile || importLoading || createManyMutation.isLoading}
              >
                {(importLoading || createManyMutation.isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Tamu
              </Button>
              <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportFile(null); setImportPreview([]); }}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl text-center">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">QR Code Tamu</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowQrModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{showQrModal.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={showQrModal.qr} alt="QR Code" className="mx-auto h-48 w-48" />
            <p className="mt-3 text-xs text-muted-foreground">Scan untuk buka undangan personal</p>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                const a = document.createElement('a');
                a.href = showQrModal.qr;
                a.download = `qr-${showQrModal.name.replace(/\s+/g, '-')}.png`;
                a.click();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh QR Code
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
