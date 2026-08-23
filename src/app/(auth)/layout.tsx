import { CardTransition } from '@/components/ui/page-transition';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-8">
      <div className="w-full max-w-md">
        <CardTransition>{children}</CardTransition>
      </div>
    </div>
  );
}
