'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { RSVP_STATUS, GUEST_GROUPS } from '@/lib/constants';

export default function GuestsPage() {
  const params = useParams();
  const id = params.id as string;

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestGroup, setNewGuestGroup] = useState('');

  const {
    data: guests,
    isLoading: guestsLoading,
  } = trpc.guest.list.useQuery(
    { invitationId: id, status: statusFilter || undefined },
    { enabled: !!id }
  );

  const { data: stats, isLoading: statsLoading } =
    trpc.guest.getStats.useQuery(
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
    onError: () => {
      toast.error('Gagal menambahkan tamu');
    },
  });

  const deleteMutation = trpc.guest.delete.useMutation({
    onSuccess: () => {
      toast.success('Tamu berhasil dihapus');
      utils.guest.list.invalidate({ invitationId: id });
      utils.guest.getStats.invalidate({ invitationId: id });
    },
    onError: () => {
      toast.error('Gagal menghapus tamu');
    },
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

  const statusFilters = [
    { value: '', label: 'Semua', icon: Users },
    { value: 'ATTENDING', label: 'Hadir', icon: UserCheck },
    { value: 'NOT_ATTENDING', label: 'Tidak Hadir', icon: UserX },
    { value: 'MAYBE', label: 'Mungkin', icon: HelpCircle },
    { value: 'PENDING', label: 'Menunggu', icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daftar Tamu</h1>
          <p className="text-muted-foreground">
            Kelola tamu undangan Anda
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tamu
        </Button>
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
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors',
            'bg-white shadow-sm'
          )}
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
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.attending}
              </p>
              <p className="text-xs text-muted-foreground">Hadir</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">
                {stats.notAttending}
              </p>
              <p className="text-xs text-muted-foreground">Tidak Hadir</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.maybe}
              </p>
              <p className="text-xs text-muted-foreground">Mungkin</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground">Menunggu</p>
            </CardContent>
          </Card>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    No. HP
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Grup
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status RSVP
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const rsvpConfig =
                    RSVP_STATUS[
                      guest.rsvpStatus as keyof typeof RSVP_STATUS
                    ] || RSVP_STATUS.PENDING;
                  return (
                    <tr
                      key={guest.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {guest.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {guest.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {guest.groupName || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            rsvpConfig.color
                          )}
                        >
                          {rsvpConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteGuest(guest.id)}
                          disabled={deleteMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
          <h3 className="mb-2 text-lg font-semibold">
            Belum ada tamu
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Tambahkan tamu undangan Anda
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Tamu
          </Button>
        </div>
      )}

      {/* Add Guest Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tambah Tamu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddDialog(false)}
              >
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
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Grup (opsional)
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newGuestGroup}
                  onChange={(e) => setNewGuestGroup(e.target.value)}
                >
                  <option value="">Pilih grup</option>
                  {GUEST_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isLoading}
                >
                  {createMutation.isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Tambah Tamu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
