'use client';

import { useEffect } from 'react';

/**
 * Warns before losing edits that have not been saved.
 *
 * The invitation editor holds a couple of dozen fields plus the event, bank
 * account, gallery and love story lists. Someone can spend twenty minutes on
 * it, click the sidebar, and lose the lot without being asked — which is the
 * kind of thing people do not come back from.
 *
 * Two escapes have to be covered:
 *
 * - Closing the tab, reloading, or following a link off the site, which the
 *   browser handles through `beforeunload`.
 * - Navigating inside the app. The App Router has no way to block a client
 *   navigation, so the click is intercepted on the anchor before the router
 *   ever sees it.
 */
export function useUnsavedChanges(isDirty: boolean, message: string) {
  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // Browsers ignore custom text now and show their own wording; assigning
      // returnValue is still what makes the prompt appear at all.
      event.preventDefault();
      event.returnValue = '';
    };

    const onClick = (event: MouseEvent) => {
      // Let the browser handle anything that is not a plain left click, so
      // "open in new tab" keeps working and never prompts.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.target && anchor.target !== '_self') return;

      // Same-page links are not a navigation away from the work.
      const destination = new URL(href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname
      ) {
        return;
      }

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    // Capture phase: the router's own handler runs on bubble, so this has to
    // see the click first to be able to stop it.
    document.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [isDirty, message]);
}
