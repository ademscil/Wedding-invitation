import { describe, it, expect } from 'vitest';
import { toYouTubeEmbed } from '@/lib/video';

describe('toYouTubeEmbed', () => {
  it('converts a standard watch URL', () => {
    expect(toYouTubeEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('converts a youtu.be short link', () => {
    expect(toYouTubeEmbed('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('converts a live URL', () => {
    expect(toYouTubeEmbed('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('passes an already-embeddable URL through', () => {
    expect(toYouTubeEmbed('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('ignores extra query parameters', () => {
    expect(
      toYouTubeEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=abc')
    ).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('tolerates surrounding whitespace', () => {
    expect(toYouTubeEmbed('  https://youtu.be/dQw4w9WgXcQ  ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  // The return value is fed straight into an iframe src, so anything that is
  // not a YouTube video must be refused rather than framed.
  it('refuses a non-YouTube host', () => {
    expect(toYouTubeEmbed('https://evil.example.com/watch?v=abc123')).toBeNull();
  });

  it('refuses a lookalike host', () => {
    expect(toYouTubeEmbed('https://youtube.com.evil.test/watch?v=abc123')).toBeNull();
  });

  it('refuses a javascript: URL', () => {
    expect(toYouTubeEmbed('javascript:alert(1)')).toBeNull();
  });

  it('refuses a YouTube URL with no video id', () => {
    expect(toYouTubeEmbed('https://www.youtube.com/watch')).toBeNull();
    expect(toYouTubeEmbed('https://www.youtube.com/')).toBeNull();
  });

  it('refuses a malformed or empty string', () => {
    expect(toYouTubeEmbed('not a url')).toBeNull();
    expect(toYouTubeEmbed('')).toBeNull();
  });
});
