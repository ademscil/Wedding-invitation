'use client';

import { Mail, Users, UserCheck, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InvitationData {
  _count: {
    guests: number;
    wishes: number;
    analyticsEvents: number;
  };
  guests?: Array<{ rsvpStatus: string }>;
}

interface StatsCardsProps {
  invitations: InvitationData[];
}

export function StatsCards({ invitations }: StatsCardsProps) {
  const totalInvitations = invitations.length;
  const totalGuests = invitations.reduce(
    (sum, inv) => sum + inv._count.guests,
    0
  );
  const totalAttending = invitations.reduce((sum, inv) => {
    if (inv.guests) {
      return (
        sum + inv.guests.filter((g) => g.rsvpStatus === 'ATTENDING').length
      );
    }
    return sum;
  }, 0);
  const totalWishes = invitations.reduce(
    (sum, inv) => sum + inv._count.wishes,
    0
  );

  const stats = [
    {
      label: 'Total Undangan',
      value: totalInvitations,
      icon: Mail,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Total Tamu',
      value: totalGuests,
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Tamu Hadir',
      value: totalAttending,
      icon: UserCheck,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Total Ucapan',
      value: totalWishes,
      icon: MessageSquare,
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
