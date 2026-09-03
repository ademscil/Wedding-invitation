import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

/**
 * Attribution badge shown on tiers whose plan includes a watermark.
 * Rendered server-side alongside the template so it cannot be toggled off
 * from the client.
 * Engineered with high-converting viral loop CTA to attract new couples.
 */
export function InvitationWatermark() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2">
      <Link
        href="/?utm_source=invitation_watermark&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto group flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-1.5 text-[11px] font-medium text-white/95 shadow-lg backdrop-blur-md transition-all hover:bg-black/80 hover:scale-105"
      >
        <Sparkles className="h-3 w-3 text-accent animate-pulse" />
        <span className="opacity-80">Dibuat dengan</span>
        <span className="font-semibold text-accent">{APP_NAME}</span>
        <span className="hidden sm:inline text-white/60">•</span>
        <span className="hidden sm:inline text-white/90 group-hover:underline">Buat Gratis →</span>
      </Link>
    </div>
  );
}
