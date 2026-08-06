'use client';

import { useEffect } from 'react';

/**
 * Closes an overlay when Escape is pressed.
 *
 * The dialogs in this app are hand-rolled rather than Radix-based, so they get
 * no keyboard dismissal for free — without this a keyboard user has to tab to
 * the close button.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}
