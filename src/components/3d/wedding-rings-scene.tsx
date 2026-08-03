'use client';

import dynamic from 'next/dynamic';

const WeddingRingsCanvas = dynamic(() => import('./wedding-rings-canvas'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-full bg-secondary-200/20" />,
});

export function WeddingRingsScene({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <WeddingRingsCanvas />
    </div>
  );
}
