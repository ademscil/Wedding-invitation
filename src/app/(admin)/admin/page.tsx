import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Users, Mail, MessageSquare, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const [totalUsers, totalInvitations, publishedInvitations, totalWishes, totalGuests] =
    await Promise.all([
      prisma.user.count(),
      prisma.invitation.count(),
      prisma.invitation.count({ where: { status: 'PUBLISHED' } }),
      prisma.wish.count(),
      prisma.guest.count(),
    ]);

  const stats = [
    { label: 'Total Pengguna', value: totalUsers, icon: Users, color: '#6366F1' },
    { label: 'Total Undangan', value: totalInvitations, icon: Mail, color: '#D4A574' },
    { label: 'Undangan Aktif', value: publishedInvitations, icon: FileCheck, color: '#7BAF7B' },
    { label: 'Total Ucapan', value: totalWishes, icon: MessageSquare, color: '#C97B7B' },
  ];

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, email: true, subscriptionTier: true, createdAt: true },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview platform WedInvite</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full p-3" style={{ backgroundColor: stat.color + '20' }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pengguna Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{user.name || 'No Name'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {user.subscriptionTier}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tamu</span>
              <span className="font-medium">{totalGuests.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Undangan Published</span>
              <span className="font-medium">{publishedInvitations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Undangan</span>
              <span className="font-medium">{totalInvitations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Ucapan</span>
              <span className="font-medium">{totalWishes}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
