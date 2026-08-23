import { Providers } from '@/components/providers/TRPCProvider';
import { CardTransition } from '@/components/ui/page-transition';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * The auth screens call tRPC directly — password reset issues and consumes
     * its token through it — so this group needs the provider too. Without it
     * the client is null and the page fails to render at all.
     */
    <Providers>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-8">
        <div className="w-full max-w-md">
          <CardTransition>{children}</CardTransition>
        </div>
      </div>
    </Providers>
  );
}
