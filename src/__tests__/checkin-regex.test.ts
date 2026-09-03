import { describe, it, expect } from 'vitest';

function parseScannedCode(code: string): string {
  const match = code.match(/\/to\/([^/?#]+)/) || code.match(/[?&]to=([^&]+)/);
  return match ? match[1] : code.trim();
}

describe('Check-in QR Code Parser for Smartphone Scanners', () => {
  it('extracts personal link from standard guest URL path', () => {
    const url = 'https://wedinvite.com/andi-dan-budi/to/abc123xyz';
    expect(parseScannedCode(url)).toBe('abc123xyz');
  });

  it('extracts personal link when URL has query parameters or hash', () => {
    const url = 'https://wedinvite.com/andi-dan-budi/to/abc123xyz?source=wa#details';
    expect(parseScannedCode(url)).toBe('abc123xyz');
  });

  it('extracts personal link from query parameter fallback format', () => {
    const url = 'https://wedinvite.com/andi-dan-budi?to=abc123xyz';
    expect(parseScannedCode(url)).toBe('abc123xyz');
  });

  it('tolerates localhost URLs used in development and mobile testing', () => {
    const url = 'http://localhost:3000/dimas-kirana/to/tamu-vip-01';
    expect(parseScannedCode(url)).toBe('tamu-vip-01');
  });

  it('returns raw personal link when code is input manually without URL', () => {
    const rawCode = 'tamu-vip-01';
    expect(parseScannedCode(rawCode)).toBe('tamu-vip-01');
  });

  it('trims whitespace on manually input code', () => {
    const rawCode = '   abc123xyz   ';
    expect(parseScannedCode(rawCode)).toBe('abc123xyz');
  });
});

