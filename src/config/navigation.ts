import {
  LayoutDashboard,
  Mail,
  Users,
  BarChart3,
  Settings,
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
];
