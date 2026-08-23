'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Users, QrCode, Lock, Undo2, CameraOff } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvitationTabs } from '@/components/dashboard/invitation-tabs';

type CheckinResult = {
  success: boolean;
  message: string;
  guest: { name: string; rsvpGuestCount: number | null } | null;
} | null;

/** Ignore repeat reads of the same code for this long — the camera fires continuously. */
const SCAN_DEBOUNCE_MS = 3000;

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();

  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<CheckinResult>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: stats,
    refetch: refetchStats,
    error: statsError,
  } = trpc.checkin.getCheckinStats.useQuery(
    { invitationId: id },
    { enabled: !!id, refetchInterval: scanning ? 5000 : 15000, retry: false }
  );

  const { data: invitation } = trpc.invitation.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const showResult = useCallback((next: CheckinResult) => {
    setResult(next);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => setResult(null), 4000);
  }, []);

  const verify = trpc.checkin.verifyGuest.useMutation({
    onSuccess: (data) => {
      showResult(data);
      void refetchStats();
    },
    onError: (error) => {
      showResult({ success: false, message: error.message, guest: null });
    },
  });

  const undo = trpc.checkin.undoCheckin.useMutation({
    onSuccess: () => {
      toast.success('Check-in dibatalkan');
      void refetchStats();
    },
    onError: (error) => toast.error(error.message || 'Gagal membatalkan check-in'),
  });

  const handleScan = useCallback(
    (code: string) => {
      const value = code.trim();
      if (!value || verify.isLoading) return;

      // Suppress the burst of identical reads a camera produces per QR.
      const last = lastScanRef.current;
      if (last && last.code === value && Date.now() - last.at < SCAN_DEBOUNCE_MS) return;
      lastScanRef.current = { code: value, at: Date.now() };

      // The server accepts a full URL or a bare code and extracts the link itself.
      verify.mutate({ personalLink: value, invitationId: id });
    },
    [id, verify]
  );

  // Mount and tear down the camera scanner alongside the `scanning` flag.
  useEffect(() => {
    if (!scanning) return;

    let scanner: { clear: () => Promise<void> } | null = null;
    let cancelled = false;

    setCameraError(null);

    import('html5-qrcode')
      .then(({ Html5QrcodeScanner }) => {
        if (cancelled) return;

        const instance = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
          false
        );

        instance.render(
          (decodedText: string) => handleScan(decodedText),
          () => {
            // Per-frame decode misses are normal; nothing to report.
          }
        );

        scanner = instance;
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError('Gagal memuat pemindai. Gunakan input manual di bawah.');
          setScanning(false);
        }
      });

    return () => {
      cancelled = true;
      // `clear()` is what releases the camera stream — `stop()` does not exist here.
      scanner?.clear().catch(() => undefined);
    };
  }, [scanning, handleScan]);

  useEffect(() => {
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    handleScan(code);
    setManualCode('');
  };

  const header = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Check-in</h1>
        {invitation && (
          <p className="text-sm text-muted-foreground">
            {invitation.brideName} &amp; {invitation.groomName}
          </p>
        )}
      </div>
      <InvitationTabs invitationId={id} active="checkin" />
    </div>
  );

  // The check-in feature itself is plan-gated on the server.
  const gated =
    statsError?.data?.code === 'FORBIDDEN' || verify.error?.data?.code === 'FORBIDDEN';

  if (gated) {
    return (
      <div className="space-y-6 p-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 rounded-full bg-amber-100 p-4">
              <Lock className="h-7 w-7 text-amber-700" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">QR Check-in belum aktif</h2>
            <p className="mb-5 max-w-sm text-sm text-muted-foreground">
              {statsError?.message ||
                verify.error?.message ||
                'Fitur ini tersedia pada paket Business.'}
            </p>
            <Button asChild>
              <Link href="/dashboard/upgrade">Lihat Paket</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const notYet = stats ? stats.total - stats.checkedIn : 0;

  return (
    <div className="space-y-6 p-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Tamu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Check className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600">{stats?.checkedIn ?? 0}</p>
              <p className="text-xs text-muted-foreground">Sudah Check-in</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <QrCode className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{notYet}</p>
              <p className="text-xs text-muted-foreground">Belum Hadir</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.headcount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Orang di Lokasi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result && (
              <div
                className={`flex items-start gap-3 rounded-lg p-4 ${
                  result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
                role="status"
                aria-live="polite"
              >
                {result.success ? (
                  <Check className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <X className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{result.message}</p>
                  {result.guest && (
                    <p className="text-sm">{result.guest.rsvpGuestCount || 1} orang</p>
                  )}
                </div>
              </div>
            )}

            {cameraError && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <CameraOff className="h-4 w-4 shrink-0" />
                {cameraError}
              </div>
            )}

            <div id="qr-reader" />

            <Button
              variant={scanning ? 'destructive' : 'default'}
              className="w-full"
              onClick={() => setScanning((v) => !v)}
            >
              {scanning ? 'Hentikan Kamera' : 'Mulai Scan Kamera'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">atau input manual</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Kode personal tamu..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                }}
              />
              <Button onClick={handleManualSubmit} disabled={verify.isLoading}>
                Check-in
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-in Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.recentCheckins.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada check-in
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentCheckins.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{guest.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {guest.checkedInAt
                          ? new Date(guest.checkedInAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}{' '}
                        · {guest.rsvpGuestCount || 1} orang
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      disabled={undo.isLoading}
                      onClick={() => undo.mutate({ guestId: guest.id, invitationId: id })}
                      aria-label={`Batalkan check-in ${guest.name}`}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
