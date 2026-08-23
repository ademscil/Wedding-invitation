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
    // Two per row on phones — one full-width card each was burning a whole
    // screen of scroll for four numbers.
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
              <div className={`shrink-0 rounded-lg p-2 sm:p-3 ${stat.color}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs leading-tight text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
                <p className="text-xl font-bold sm:text-2xl">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
