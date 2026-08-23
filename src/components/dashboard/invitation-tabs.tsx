'use client';

import Link from 'next/link';
import { FileText, Users, ListChecks, BarChart3, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InvitationTab = 'detail' | 'guests' | 'planner' | 'analytics' | 'checkin';

interface InvitationTabsProps {
  invitationId: string;
  active: InvitationTab;
  guestCount?: number;
}

/**
 * Single source of navigation for the invitation sub-pages. Previously each
 * page carried its own copy, which left the analytics and check-in pages
 * unreachable because no tab bar linked to them.
 */
export function InvitationTabs({ invitationId, active, guestCount }: InvitationTabsProps) {
  const base = `/dashboard/invitations/${invitationId}`;

  const tabs: { key: InvitationTab; label: string; href: string; icon: typeof FileText }[] = [
    { key: 'detail', label: 'Detail', href: base, icon: FileText },
    {
      key: 'guests',
      label: guestCount !== undefined ? `Tamu (${guestCount})` : 'Tamu',
      href: `${base}/guests`,
      icon: Users,
    },
    { key: 'planner', label: 'Planner', href: `${base}/planner`, icon: ListChecks },
    { key: 'analytics', label: 'Analitik', href: `${base}/analytics`, icon: BarChart3 },
    { key: 'checkin', label: 'Check-in', href: `${base}/checkin`, icon: QrCode },
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
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-center text-sm font-medium transition-colors',
              isActive ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
