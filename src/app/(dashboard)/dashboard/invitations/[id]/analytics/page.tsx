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
} from 'recharts';
import { ArrowLeft, Eye, Users, MessageCircle, Gift } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvitationTabs } from '@/components/dashboard/invitation-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useFeature, FeatureLocked } from '@/components/dashboard/feature-gate';
import { coupleNames } from '@/lib/invitation-data';

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

export default function AnalyticsPage() {
  const hasAnalytics = useFeature('hasAnalytics');

  const { id } = useParams<{ id: string }>();
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.analytics.getStats.useQuery(
    { invitationId: id },
    // The plan gate answers FORBIDDEN; the locked screen below handles that,
    // so only query once we know the feature is available.
    { enabled: !!id && hasAnalytics === true }
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
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });
    const countByDay: Record<string, number> = {};
    stats.recentViews.forEach((v) => {
      const day = format(new Date(v.createdAt), 'yyyy-MM-dd');
      countByDay[day] = (countByDay[day] || 0) + 1;
    });
    return last30Days.map((date) => ({
      date: format(date, 'd MMM', { locale: localeId }),
      views: countByDay[format(date, 'yyyy-MM-dd')] || 0,
    }));
  })();

  const rsvpPieData = rsvpStats
    ? [
        { name: 'Hadir', value: rsvpStats.attending, color: '#7BAF7B' },
        { name: 'Tidak Hadir', value: rsvpStats.notAttending, color: '#C75050' },
        { name: 'Mungkin', value: rsvpStats.maybe, color: '#D4A574' },
        { name: 'Belum Konfirmasi', value: rsvpStats.pending, color: '#9CA3AF' },
      ].filter((d) => d.value > 0)
    : [];

  // Order matters: the plan gate decides whether this page is available at all,
  // then a failed load, and only then the loading skeleton.
  if (hasAnalytics === false) {
    return (
      <div className="p-6">
        <FeatureLocked
          title="Statistik belum tersedia"
          description="Lihat jumlah kunjungan, RSVP, dan ucapan pada undangan Anda secara real-time."
          requiredPlan="Starter"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || hasAnalytics === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/invitations/${id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Statistik Undangan</h1>
          {invitation && (
            <p className="text-sm text-muted-foreground">
              {coupleNames(invitation)}
            </p>
          )}
        </div>
      </div>

      <InvitationTabs invitationId={id} active="analytics" />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="Total Kunjungan" value={stats?.totalViews ?? 0} color="#6366F1" />
        <StatCard icon={Users} label="RSVP Masuk" value={stats?.totalRsvps ?? 0} color="#7BAF7B" />
        <StatCard icon={MessageCircle} label="Ucapan" value={stats?.totalWishes ?? 0} color="#D4A574" />
        <StatCard icon={Gift} label="Klik Hadiah" value={stats?.totalGiftClicks ?? 0} color="#C97B7B" />
      </div>

      {/* Views Chart */}
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
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
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

      {/* RSVP Breakdown */}
      {rsvpPieData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
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
                    {rsvpPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tamu`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Tamu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {rsvpStats && (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                    <span className="text-sm font-medium text-green-800">Total Hadir</span>
                    <span className="font-bold text-green-700">{rsvpStats.totalGuestCount} orang</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm font-medium">Total Tamu Terdaftar</span>
                    <span className="font-bold">{rsvpStats.total} undangan</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm font-medium">Sudah Buka Undangan</span>
                    <span className="font-bold">{rsvpStats.opened} tamu</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
