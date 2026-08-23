'use client';

import Link from 'next/link';
import { FileText, Users, BarChart3, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InvitationTab = 'detail' | 'guests' | 'analytics' | 'checkin';

interface InvitationTabsProps {
  invitationId: string;
  active: InvitationTab;
  guestCount?: number;
}

export function InvitationTabs({ invitationId, active, guestCount }: InvitationTabsProps) {
  const tabs: { key: InvitationTab; label: string; href: string; icon: typeof FileText }[] = [
    {
      key: 'detail',
      label: 'Detail',
      href: `/dashboard/invitations/${invitationId}`,
      icon: FileText,
    },
    {
      key: 'guests',
      label: guestCount !== undefined ? `Tamu (${guestCount})` : 'Tamu',
      href: `/dashboard/invitations/${invitationId}/guests`,
      icon: Users,
    },
    {
      key: 'analytics',
      label: 'Analitik',
      href: `/dashboard/invitations/${invitationId}/analytics`,
      icon: BarChart3,
    },
    {
      key: 'checkin',
      label: 'Check-in',
      href: `/dashboard/invitations/${invitationId}/checkin`,
      icon: QrCode,
    },
  ];

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1"
      aria-label="Navigasi undangan"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-4 py-2 text-center text-sm font-medium transition-colors',
              isActive
                ? 'bg-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
