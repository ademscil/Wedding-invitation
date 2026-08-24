import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { Providers } from '@/components/providers/TRPCProvider';
import { PageTransition } from '@/components/ui/page-transition';
import { AdminSidebarNav, AdminTopNav } from './admin-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    /*
     * Every admin screen reads its data over tRPC, so this group needs the
     * provider just as the dashboard does. Without it each page throws
     * "Unable to retrieve application context" and renders a 500 — which went
     * unnoticed because /admin itself is the one page that uses no query.
     */
    <Providers>
      <div className="flex min-h-screen bg-muted/30">
        {/* Sidebar — wide screens */}
        <aside className="hidden w-56 shrink-0 flex-col border-r bg-card lg:flex">
          <div className="border-b p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              WedInvite Admin
            </p>
          </div>
          <AdminSidebarNav />
          <div className="border-t p-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Scrollable pill nav — narrow screens */}
          <AdminTopNav />
          <main className="min-w-0 flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </Providers>
  );
}
