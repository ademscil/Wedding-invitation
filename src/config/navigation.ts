import {
  LayoutDashboard,
  Mail,
  Users,
  BarChart3,
  Settings,
  QrCode,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const dashboardNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Undangan Saya',
    href: '/dashboard/invitations',
    icon: Mail,
  },
  {
    title: 'Upgrade',
    href: '/dashboard/upgrade',
    icon: CreditCard,
  },
  {
    title: 'Pengaturan',
    href: '/dashboard/profile',
    icon: Settings,
  },
];

export const invitationNav = (id: string): NavItem[] => [
  {
    title: 'Detail',
    href: `/dashboard/invitations/${id}`,
    icon: Mail,
  },
  {
    title: 'Tamu',
    href: `/dashboard/invitations/${id}/guests`,
    icon: Users,
  },
  {
    title: 'Statistik',
    href: `/dashboard/invitations/${id}/analytics`,
    icon: BarChart3,
  },
  {
    title: 'Check-in',
    href: `/dashboard/invitations/${id}/checkin`,
    icon: QrCode,
  },
];
