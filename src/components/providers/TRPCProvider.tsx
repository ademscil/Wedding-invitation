'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { SessionProvider } from 'next-auth/react';
import superjson from 'superjson';
import { trpc } from '@/lib/trpc/client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /**
             * Never retry a request the server has already refused on its
             * merits. A plan gate (FORBIDDEN), a missing record (NOT_FOUND) or
             * an expired session (UNAUTHORIZED) will answer the same way three
             * times over — retrying only keeps the UI stuck on skeletons and
             * triples the load.
             */
            retry: (failureCount, error) => {
              const status = (error as { data?: { httpStatus?: number } })?.data
                ?.httpStatus;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
