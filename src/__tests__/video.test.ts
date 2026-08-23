import { describe, it, expect } from 'vitest';
import { parseVideoUrl, toYouTubeEmbed } from '@/lib/video';

describe('parseVideoUrl', () => {
  it('accepts the share link YouTube actually hands out', () => {
    const result = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toEqual({
      provider: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
  ])('normalises %s to the embed form', (url) => {
    expect(parseVideoUrl(url)?.embedUrl).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('keeps extra query parameters out of the embed URL', () => {
    // A copied link often carries ?t= or ?si=; those must not be appended
    // blindly, because the section adds its own autoplay parameter.
    expect(
      parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?si=abc123&t=42')?.embedUrl
    ).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('handles Vimeo share and player links', () => {
    expect(parseVideoUrl('https://vimeo.com/123456789')).toEqual({
      provider: 'vimeo',
      embedUrl: 'https://player.vimeo.com/video/123456789',
      thumbnailUrl: null,
    });
    expect(parseVideoUrl('https://player.vimeo.com/video/123456789')?.provider).toBe(
      'vimeo'
    );
    expect(parseVideoUrl('https://vimeo.com/channels/staffpicks/123456789')?.embedUrl).toBe(
      'https://player.vimeo.com/video/123456789'
    );
  });

  it('tolerates surrounding whitespace from a paste', () => {
    expect(parseVideoUrl('  https://youtu.be/dQw4w9WgXcQ  ')?.provider).toBe(
      'youtube'
    );
  });

  it.each([
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
    ['not a URL at all', 'dQw4w9WgXcQ'],
    ['a bare domain', 'https://youtube.com'],
    ['a YouTube page that is not a video', 'https://www.youtube.com/results?q=x'],
  ])('refuses %s', (_label, input) => {
    expect(parseVideoUrl(input)).toBeNull();
  });

  it('refuses a lookalike host', () => {
    // The result goes straight into an iframe src, so a hostname that merely
    // ends in youtube.com must not be framed.
    expect(parseVideoUrl('https://youtube.com.evil.example/watch?v=abcdef')).toBeNull();
    expect(parseVideoUrl('https://notyoutube.com/watch?v=abcdef')).toBeNull();
    expect(parseVideoUrl('https://evil.example/embed/abcdef')).toBeNull();
  });

  it('refuses a scheme that is not http(s)', () => {
    expect(parseVideoUrl('javascript:alert(1)')).toBeNull();
    expect(parseVideoUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });
});

describe('toYouTubeEmbed', () => {
  it('returns an embed URL for YouTube only', () => {
    expect(toYouTubeEmbed('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
    expect(toYouTubeEmbed('https://vimeo.com/123456789')).toBeNull();
    expect(toYouTubeEmbed('nonsense')).toBeNull();
  });
});
