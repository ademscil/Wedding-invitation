'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Eye, Users, MessageCircle, Gift, Lock, Share2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { InvitationTabs } from '@/components/dashboard/invitation-tabs';

const DEVICE_COLORS = ['#6366F1', '#7BAF7B', '#D4A574', '#C97B7B', '#9CA3AF'];

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-full p-3" style={{ backgroundColor: color + '20' }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString('id-ID')}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown when the caller's plan does not include analytics. */
function UpgradeNotice({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 rounded-full bg-amber-100 p-4">
          <Lock className="h-7 w-7 text-amber-700" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Statistik belum tersedia</h2>
        <p className="mb-5 max-w-sm text-sm text-muted-foreground">{message}</p>
        <Button asChild>
          <Link href="/dashboard/upgrade">Lihat Paket</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: stats,
    isLoading,
    error,
  } = trpc.analytics.getStats.useQuery(
    { invitationId: id },
    { enabled: !!id, retry: false }
  );
  const { data: invitation } = trpc.invitation.getById.useQuery(
    { id },
    { enabled: !!id }
  );
  const { data: rsvpStats } = trpc.guest.getStats.useQuery(
    { invitationId: id },
    { enabled: !!id }
  );

  const viewsChartData = (() => {
    if (!stats?.recentViews) return [];

    const countByDay = new Map<string, number>();
    for (const view of stats.recentViews) {
      const day = format(new Date(view.createdAt), 'yyyy-MM-dd');
      countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
    }

    return eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map(
      (date) => ({
        date: format(date, 'd MMM', { locale: localeId }),
        views: countByDay.get(format(date, 'yyyy-MM-dd')) ?? 0,
      })
    );
  })();

  const rsvpPieData = rsvpStats
    ? [
        { name: 'Hadir', value: rsvpStats.attending, color: '#7BAF7B' },
        { name: 'Tidak Hadir', value: rsvpStats.notAttending, color: '#C75050' },
        { name: 'Mungkin', value: rsvpStats.maybe, color: '#D4A574' },
        { name: 'Belum Konfirmasi', value: rsvpStats.pending, color: '#9CA3AF' },
      ].filter((d) => d.value > 0)
    : [];

  const header = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistik Undangan</h1>
        {invitation && (
          <p className="text-sm text-muted-foreground">
            {invitation.brideName} &amp; {invitation.groomName}
          </p>
        )}
      </div>
      <InvitationTabs invitationId={id} active="analytics" />
    </div>
  );

  if (error?.data?.code === 'FORBIDDEN') {
    return (
      <div className="space-y-6 p-6">
        {header}
        <UpgradeNotice message={error.message} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {header}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const hasAnyViews = (stats?.totalViews ?? 0) > 0;

  return (
    <div className="space-y-6 p-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Eye} label="Kunjungan" value={stats?.totalViews ?? 0} color="#6366F1" />
        <StatCard icon={Users} label="RSVP Masuk" value={stats?.totalRsvps ?? 0} color="#7BAF7B" />
        <StatCard
          icon={MessageCircle}
          label="Ucapan"
          value={stats?.totalWishes ?? 0}
          color="#D4A574"
        />
        <StatCard
          icon={Gift}
          label="Klik Hadiah"
          value={stats?.totalGiftClicks ?? 0}
          color="#C97B7B"
        />
        <StatCard icon={Share2} label="Dibagikan" value={stats?.totalShares ?? 0} color="#8B6F5C" />
      </div>

      {!hasAnyViews && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada kunjungan. Bagikan link undangan ke tamu untuk mulai mengumpulkan
          statistik.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kunjungan 30 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={viewsChartData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="views"
                name="Kunjungan"
                stroke="#6366F1"
                fill="url(#viewsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {rsvpPieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Konfirmasi Kehadiran</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={rsvpPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rsvpPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tamu`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {rsvpStats && (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Tamu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <span className="text-sm font-medium text-green-800">Perkiraan Hadir</span>
                <span className="font-bold text-green-700">
                  {rsvpStats.totalGuestCount} orang
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm font-medium">Tamu Terdaftar</span>
                <span className="font-bold">{rsvpStats.total} undangan</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm font-medium">Sudah Membuka Undangan</span>
                <span className="font-bold">
                  {rsvpStats.opened}
                  {rsvpStats.total > 0 && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({Math.round((rsvpStats.opened / rsvpStats.total) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm font-medium">Sudah Check-in</span>
                <span className="font-bold">{rsvpStats.checkedIn} tamu</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {(stats?.devices.length ?? 0) > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Perangkat</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats?.devices ?? []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(stats?.devices ?? []).map((entry, index) => (
                      <Cell key={entry.name} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} kunjungan`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sumber Kunjungan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.referrers ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip formatter={(value) => [`${value} kunjungan`, '']} />
                  <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
