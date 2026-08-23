'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardNav } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';

interface DashboardSidebarContentProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onNavigate?: () => void;
}

/**
 * Navigation body, shared by the desktop sidebar and the mobile drawer.
 * The frame around it lives in DashboardShell.
 */
export function DashboardSidebarContent({
  user,
  onNavigate,
}: DashboardSidebarContentProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 px-5 lg:h-16 lg:px-6">
        <Heart className="h-5 w-5 shrink-0 text-primary lg:h-6 lg:w-6" />
        <span className="truncate text-lg font-bold text-primary lg:text-xl">
          WedInvite
        </span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {dashboardNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="shrink-0 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user.image || undefined} alt="" />
            <AvatarFallback className="text-xs">
              {getInitials(user.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.name || 'Pengguna'}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-muted-foreground"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
