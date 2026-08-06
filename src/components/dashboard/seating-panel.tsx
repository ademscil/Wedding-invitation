'use client';

import { useState } from 'react';
import { Plus, Trash2, UserMinus, Wand2, RotateCcw, Armchair } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SeatingCanvas } from './seating-canvas';

export function SeatingPanel({
  invitationId,
  enabled,
}: {
  invitationId: string;
  enabled: boolean;
}) {
  const utils = trpc.useUtils();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [form, setForm] = useState({ name: '', capacity: '8' });

  const { data, isLoading } = trpc.seating.getLayout.useQuery(
    { invitationId },
    { enabled }
  );

  const refresh = () => {
    utils.seating.getLayout.invalidate({ invitationId });
  };

  const onError = (error: { message: string }) =>
    toast.error(error.message || 'Terjadi kesalahan');

  const createTable = trpc.seating.createTable.useMutation({
    onSuccess: () => {
      toast.success('Meja ditambahkan');
      refresh();
    },
    onError,
  });
  // Position updates fire on every drag release, so they stay quiet on success.
  const updateTable = trpc.seating.updateTable.useMutation({
    onSuccess: refresh,
    onError,
  });
  const deleteTable = trpc.seating.deleteTable.useMutation({
    onSuccess: () => {
      toast.success('Meja dihapus, tamunya kembali ke daftar belum duduk');
      setSelectedTableId(null);
      refresh();
    },
    onError,
  });
  const assignGuest = trpc.seating.assignGuest.useMutation({
    onSuccess: refresh,
    onError,
  });
  const autoArrange = trpc.seating.autoArrange.useMutation({
    onSuccess: (result) => {
      if (result.noTables) {
        toast.info('Buat minimal satu meja dulu sebelum menyusun otomatis.');
        return;
      }
      if (result.seated === 0 && result.unseated === 0) {
        toast.info('Semua tamu sudah mendapat meja.');
        return;
      }
      toast.success(
        result.unseated > 0
          ? `${result.seated} tamu didudukkan, ${result.unseated} belum kebagian kursi`
          : `${result.seated} tamu berhasil didudukkan`
      );
      refresh();
    },
    onError,
  });
  const resetSeating = trpc.seating.resetSeating.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.unseated} tamu dikosongkan dari meja`);
      refresh();
    },
    onError,
  });

  const selectedTable = data?.tables.find((t) => t.id === selectedTableId);

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  return (
    <div className="space-y-4">
      {data && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Meja', value: `${data.summary.tableCount}` },
            {
              label: 'Kursi terpakai',
              value: `${data.summary.seatsUsed} / ${data.summary.totalSeats}`,
            },
            { label: 'Kursi kosong', value: `${data.summary.seatsFree}` },
            {
              label: 'Belum duduk',
              value: `${data.summary.unassignedHeads} kursi`,
            },
          ].map((tile) => (
            <Card key={tile.label}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{tile.label}</p>
                <p className="text-lg font-semibold">{tile.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg">Denah Meja</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => autoArrange.mutate({ invitationId })}
              disabled={autoArrange.isPending || !data?.tables.length}
            >
              <Wand2 className="mr-1.5 h-4 w-4" />
              Susun otomatis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmReset(true)}
              disabled={resetSeating.isPending || !data?.summary.seatsUsed}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Kosongkan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="table-name"
              placeholder="Nama meja (mis. Meja Keluarga 1)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="sm:flex-1"
            />
            <Input
              name="table-capacity"
              aria-label="Kapasitas meja"
              placeholder="Kapasitas"
              inputMode="numeric"
              value={form.capacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, capacity: e.target.value }))
              }
              className="sm:w-32"
            />
            <Button
              onClick={() => {
                const capacity = Number.parseInt(form.capacity, 10);
                if (!form.name.trim()) {
                  toast.error('Nama meja wajib diisi');
                  return;
                }
                if (!Number.isFinite(capacity) || capacity < 1) {
                  toast.error('Kapasitas minimal 1 kursi');
                  return;
                }
                createTable.mutate({
                  invitationId,
                  name: form.name.trim(),
                  capacity,
                  // Stagger new tables so they don't stack on one spot.
                  positionX: 20 + ((data?.tables.length ?? 0) % 4) * 20,
                  positionY:
                    30 + Math.floor((data?.tables.length ?? 0) / 4) * 22,
                });
                setForm({ name: '', capacity: form.capacity });
              }}
              disabled={createTable.isPending}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Meja
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Geser meja untuk mengatur denah. Klik meja untuk melihat dan mengatur
            tamunya.
          </p>

          <SeatingCanvas
            tables={data?.tables ?? []}
            selectedId={selectedTableId}
            onSelect={setSelectedTableId}
            onMove={(id, positionX, positionY) =>
              updateTable.mutate({ id, positionX, positionY })
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Selected table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {selectedTable ? selectedTable.name : 'Pilih meja'}
            </CardTitle>
            {selectedTable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setDeleteTarget({
                    id: selectedTable.id,
                    name: selectedTable.name,
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTable ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Klik salah satu meja pada denah.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Terisi {selectedTable.occupied} dari {selectedTable.capacity}{' '}
                  kursi
                </p>

                {selectedTable.guests.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada tamu di meja ini.
                  </p>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {selectedTable.guests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center gap-2 p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {guest.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {guest.groupName || 'Tanpa grup'} ·{' '}
                            {guest.rsvpGuestCount || 1} kursi
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Keluarkan dari meja"
                          onClick={() =>
                            assignGuest.mutate({
                              guestId: guest.id,
                              tableId: null,
                            })
                          }
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unassigned guests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Belum duduk ({data?.unassigned.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.unassigned.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Semua tamu sudah mendapat meja.
              </p>
            ) : (
              <div className="max-h-80 divide-y overflow-y-auto rounded-lg border">
                {data.unassigned.map((guest) => (
                  <div key={guest.id} className="flex items-center gap-2 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {guest.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {guest.groupName || 'Tanpa grup'} ·{' '}
                        {guest.rsvpGuestCount || 1} kursi
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!selectedTableId || assignGuest.isPending}
                      onClick={() =>
                        assignGuest.mutate({
                          guestId: guest.id,
                          tableId: selectedTableId,
                        })
                      }
                    >
                      <Armchair className="mr-1.5 h-3.5 w-3.5" />
                      Dudukkan
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!selectedTableId && data?.unassigned.length ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Pilih meja pada denah terlebih dahulu untuk mendudukkan tamu.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus meja ini?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" akan dihapus. Tamu di meja ini kembali ke daftar belum duduk.`
            : ''
        }
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) deleteTable.mutate({ id: deleteTarget.id });
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Kosongkan semua meja?"
        description="Semua tamu akan dikeluarkan dari mejanya. Meja tetap ada."
        confirmLabel="Kosongkan"
        variant="destructive"
        onConfirm={() => {
          resetSeating.mutate({ invitationId });
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
