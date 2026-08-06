import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

/**
 * Attribution badge shown on tiers whose plan includes a watermark.
 * Rendered server-side alongside the template so it cannot be toggled off
 * from the client.
 */
export function InvitationWatermark() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2">
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white/90 shadow-lg backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        <span className="opacity-70">Dibuat dengan</span>
        <span className="font-semibold">{APP_NAME}</span>
      </Link>
    </div>
  );
}
