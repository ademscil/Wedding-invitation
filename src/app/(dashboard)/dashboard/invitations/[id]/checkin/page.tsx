'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, Users, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvitationTabs } from '@/components/dashboard/invitation-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFeature, FeatureLocked } from '@/components/dashboard/feature-gate';

type CheckinResult = {
  success: boolean;
  message: string;
  guest: { name: string; rsvpGuestCount: number | null } | null;
} | null;

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();
  const hasQrCheckin = useFeature('hasQrCheckin');
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<CheckinResult>(null);
  const [scanning, setScanning] = useState(false);

  const { data: stats, refetch: refetchStats } = trpc.checkin.getCheckinStats.useQuery(
    { invitationId: id },
    { enabled: !!id && hasQrCheckin === true, refetchInterval: 5000 }
  );
  const verify = trpc.checkin.verifyGuest.useMutation({
    onSuccess: (data) => {
      setResult(data);
      refetchStats();
      setTimeout(() => setResult(null), 4000);
    },
    onError: (error) => {
      setResult({ success: false, message: error.message || 'Kode tidak valid', guest: null });
      toast.error(error.message || 'Gagal memverifikasi tamu');
      setTimeout(() => setResult(null), 4000);
    },
  });

  const handleScan = (code: string) => {
    if (!code || verify.isPending) return;
    // Extract personal link from URL or use raw code
    const match = code.match(/[?&]to=([^&]+)/);
    const personalLink = match ? match[1] : code;
    verify.mutate({ personalLink, invitationId: id });
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode('');
    }
  };

  /*
   * `handleScan` closes over `verify`, which is a new object on every render.
   * The scanner is only built once per session, so the callback it holds has
   * to read the current one through a ref — otherwise it keeps calling the
   * mutation captured when the camera started, and the in-flight guard below
   * never sees a pending request.
   */
  const handleScanRef = useRef(handleScan);
  handleScanRef.current = handleScan;

  useEffect(() => {
    if (!scanning) return;

    let scanner: { clear: () => Promise<void> } | null = null;
    let cancelled = false;

    import('html5-qrcode')
      .then(({ Html5QrcodeScanner }) => {
        // The user pressed Stop while the library was still loading.
        if (cancelled) return;

        const instance = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        instance.render(
          (decodedText: string) => handleScanRef.current(decodedText),
          () => {
            // Fires continuously for every frame without a code in it.
          }
        );
        scanner = instance;
      })
      .catch(() => {
        setScanning(false);
        toast.error('Gagal memuat pemindai QR. Coba muat ulang halaman.');
      });

    return () => {
      cancelled = true;
      /*
       * `clear()`, not `stop()`: `stop()` belongs to the lower-level
       * `Html5Qrcode` class and is undefined here, so the old teardown threw
       * before it could release anything and the camera stayed on — with its
       * indicator light — until the tab was closed.
       */
      scanner?.clear().catch(() => {
        // Already torn down, or the element is gone. Nothing left to release.
      });
    };
    // `handleScan` is read through a ref, so it must not restart the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  if (hasQrCheckin === false) {
    return (
      <div className="p-6">
        <FeatureLocked
          title="QR Check-in belum tersedia"
          description="Scan QR undangan tamu saat hari-H untuk mencatat kehadiran secara otomatis."
          requiredPlan="Business"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/invitations/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold sm:text-2xl">QR Check-in</h1>
      </div>

      <InvitationTabs invitationId={id} active="checkin" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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
              <p className="text-xs text-muted-foreground">Sudah Hadir</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <QrCode className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">
                {stats ? stats.total - stats.checkedIn : 0}
              </p>
              <p className="text-xs text-muted-foreground">Belum Hadir</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result && (
              <div className={`flex items-center gap-3 rounded-lg p-4 ${
                result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {result.success ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                <div>
                  <p className="font-semibold">{result.message}</p>
                  {result.success && result.guest && (
                    <p className="text-sm">{result.guest.rsvpGuestCount || 1} orang</p>
                  )}
                </div>
              </div>
            )}

            <div id="qr-reader" />

            <Button
              variant={scanning ? 'destructive' : 'default'}
              className="w-full"
              onClick={() => setScanning(!scanning)}
            >
              {scanning ? 'Stop Scan' : 'Mulai Scan Kamera'}
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
                aria-label="Kode personal tamu"
                placeholder="Kode personal tamu..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit} disabled={verify.isPending}>
                Check-in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Check-in Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentCheckins.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada check-in</p>
            ) : (
              <div className="space-y-2">
                {stats?.recentCheckins.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.checkedInAt ? new Date(g.checkedInAt).toLocaleTimeString('id-ID') : ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {g.rsvpGuestCount || 1} orang
                    </span>
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
