import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Providers } from '@/components/providers/TRPCProvider';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <Providers>
      <div className="flex min-h-screen">
        <DashboardSidebar user={session.user} />
        <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8">
          {children}
        </main>
      </div>
    </Providers>
  );
}
