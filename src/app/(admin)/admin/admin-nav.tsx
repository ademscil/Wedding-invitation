'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  MessageSquare,
  LogOut,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const adminNav = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Pengguna', href: '/admin/users', icon: Users },
  { title: 'Undangan', href: '/admin/invitations', icon: Mail },
  { title: 'Template', href: '/admin/templates', icon: FileText },
  { title: 'Ucapan', href: '/admin/wishes', icon: MessageSquare },
  { title: 'Promo', href: '/admin/promos', icon: Tag },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

/** Vertical navigation for the wide layout. */
export function AdminSidebarNav() {
  const isActive = useIsActive();

  return (
    <nav className="flex-1 space-y-1 p-3">
      {adminNav.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Horizontal navigation for narrow screens.
 * The sidebar is hidden below `lg`, which previously left an admin on a phone
 * with no way to reach any page other than the one they landed on.
 */
export function AdminTopNav() {
  const isActive = useIsActive();

  return (
    <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          WedInvite Admin
        </p>
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto px-3 pb-2"
        aria-label="Navigasi admin"
      >
        {adminNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
