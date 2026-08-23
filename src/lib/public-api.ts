/**
 * Minimal tRPC caller for the public invitation page.
 *
 * The invitation route group intentionally does not mount the React Query
 * provider — keeping the guest-facing bundle small matters more there than
 * client-side caching. These helpers speak the tRPC HTTP format directly and,
 * crucially, surface the server's error message instead of swallowing it.
 */

interface TrpcErrorShape {
  error?: { json?: { message?: string; data?: { code?: string } } };
  result?: { data?: { json?: unknown } };
}

export class PublicApiError extends Error {
  readonly code: string;

  constructor(message: string, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = 'PublicApiError';
    this.code = code;
  }
}

function unwrap<T>(payload: TrpcErrorShape, fallback: string): T {
  if (payload.error) {
    throw new PublicApiError(
      payload.error.json?.message || fallback,
      payload.error.json?.data?.code
    );
  }
  return payload.result?.data?.json as T;
}

export async function trpcMutate<T>(
  procedure: string,
  input: unknown,
  fallbackMessage = 'Terjadi kesalahan. Silakan coba lagi.'
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api/trpc/${procedure}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
  } catch {
    throw new PublicApiError('Koneksi bermasalah. Periksa jaringan Anda.', 'NETWORK');
  }

  const payload = (await response.json().catch(() => ({}))) as TrpcErrorShape;

  if (!response.ok) {
    throw new PublicApiError(
      payload.error?.json?.message || fallbackMessage,
      payload.error?.json?.data?.code
    );
  }

  return unwrap<T>(payload, fallbackMessage);
}

export async function trpcQuery<T>(
  procedure: string,
  input: unknown,
  fallbackMessage = 'Gagal memuat data.'
): Promise<T> {
  const encoded = encodeURIComponent(JSON.stringify({ json: input }));

  let response: Response;
  try {
    response = await fetch(`/api/trpc/${procedure}?input=${encoded}`);
  } catch {
    throw new PublicApiError('Koneksi bermasalah. Periksa jaringan Anda.', 'NETWORK');
  }

  const payload = (await response.json().catch(() => ({}))) as TrpcErrorShape;

  if (!response.ok) {
    throw new PublicApiError(
      payload.error?.json?.message || fallbackMessage,
      payload.error?.json?.data?.code
    );
  }

  return unwrap<T>(payload, fallbackMessage);
}

/** Fire-and-forget analytics ping; never blocks or surfaces errors to the guest. */
export function trackEvent(
  invitationSlug: string,
  eventType: 'GIFT_CLICK' | 'MUSIC_PLAY' | 'SHARE',
  metadata?: Record<string, unknown>
): void {
  void trpcMutate('analytics.track', {
    invitationSlug,
    eventType,
    ...(metadata && { metadata: JSON.stringify(metadata) }),
  }).catch(() => undefined);
}
