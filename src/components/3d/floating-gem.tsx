'use client';

import dynamic from 'next/dynamic';

const FloatingGemCanvas = dynamic(() => import('./floating-gem-canvas'), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

export function FloatingGem({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <FloatingGemCanvas />
    </div>
  );
}
