'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shown when a query fails, so a failed load reads as a problem with a way
 * forward rather than an empty list or a skeleton that never resolves.
 */
export function ErrorState({
  title = 'Gagal memuat data',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          {message || 'Terjadi kesalahan saat mengambil data.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
