/**
 * Turns a video share link into an embeddable one.
 *
 * The return value is fed straight into an iframe `src`, so anything that is
 * not a recognised video host must be refused rather than framed — a lookalike
 * hostname or a `javascript:` URL would otherwise end up embedded in the
 * invitation.
 */

export type VideoProvider = 'youtube' | 'vimeo';

export interface EmbeddableVideo {
  provider: VideoProvider;
  embedUrl: string;
  /** Still frame, where the provider exposes one without an API call. */
  thumbnailUrl: string | null;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,}$/;
const VIMEO_ID = /^\d{6,}$/;

function youTubeIdFrom(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    return url.pathname.slice(1) || null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') return url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/')) return url.pathname.replace('/embed/', '');
    if (url.pathname.startsWith('/live/')) return url.pathname.replace('/live/', '');
    if (url.pathname.startsWith('/shorts/')) return url.pathname.replace('/shorts/', '');
  }

  return null;
}

function vimeoIdFrom(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'vimeo.com') {
    // The id is the first numeric path segment: /123456789 or /channels/x/123456789
    const segment = url.pathname.split('/').filter(Boolean).find((s) => VIMEO_ID.test(s));
    return segment ?? null;
  }

  if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
    return url.pathname.replace('/video/', '');
  }

  return null;
}

export function parseVideoUrl(raw: string | null | undefined): EmbeddableVideo | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  // Only these two schemes can carry a video; anything else is refused outright.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const youTubeId = youTubeIdFrom(url);
  if (youTubeId && YOUTUBE_ID.test(youTubeId)) {
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youTubeId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${youTubeId}/hqdefault.jpg`,
    };
  }

  const vimeoId = vimeoIdFrom(url);
  if (vimeoId && VIMEO_ID.test(vimeoId)) {
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      // Vimeo thumbnails need an API call, so the section falls back to a poster.
      thumbnailUrl: null,
    };
  }

  return null;
}

/** Backwards-compatible helper for callers that only handle YouTube. */
export function toYouTubeEmbed(url: string): string | null {
  const parsed = parseVideoUrl(url);
  return parsed?.provider === 'youtube' ? parsed.embedUrl : null;
}
