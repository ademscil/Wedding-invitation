import { describe, it, expect } from 'vitest';
import {
  parseEvents,
  parseBankAccounts,
  parseGalleryImages,
  parseLoveStory,
  parseSettings,
  isSectionVisible,
  buildCalendarUrl,
} from '@/lib/invitation-data';

describe('parseEvents', () => {
  it('reads the canonical shape', () => {
    const json = JSON.stringify([
      {
        id: 'e1',
        name: 'Akad Nikah',
        date: '2026-09-12',
        startTime: '08:00',
        endTime: '10:00',
        venue: 'Masjid Al-Falah',
        address: 'Jl. Mawar 1',
        mapUrl: 'https://maps.google.com/x',
      },
    ]);

    expect(parseEvents(json)).toEqual([
      {
        id: 'e1',
        name: 'Akad Nikah',
        date: '2026-09-12',
        startTime: '08:00',
        endTime: '10:00',
        venue: 'Masjid Al-Falah',
        address: 'Jl. Mawar 1',
        mapUrl: 'https://maps.google.com/x',
      },
    ]);
  });

  it('migrates the legacy time/location shape', () => {
    const legacy = JSON.stringify([
      { name: 'Resepsi', date: '2026-09-12', time: '11:00', location: 'Gedung Melati' },
    ]);

    const [event] = parseEvents(legacy);
    expect(event.startTime).toBe('11:00');
    expect(event.venue).toBe('Gedung Melati');
    expect(event.id).toBe('event-0');
  });

  it('drops entries with neither a name nor a date', () => {
    const json = JSON.stringify([{ name: '', date: '' }, { name: 'Akad', date: '' }]);
    expect(parseEvents(json)).toHaveLength(1);
  });

  it('returns an empty array for malformed or missing input', () => {
    expect(parseEvents('not json')).toEqual([]);
    expect(parseEvents('{"a":1}')).toEqual([]);
    expect(parseEvents(null)).toEqual([]);
    expect(parseEvents(undefined)).toEqual([]);
  });
});

describe('parseBankAccounts', () => {
  it('migrates the legacy bank/accountName shape', () => {
    const legacy = JSON.stringify([
      { bank: 'BCA', accountName: 'Siti Aisyah', accountNumber: '1234567890' },
    ]);

    expect(parseBankAccounts(legacy)).toEqual([
      {
        id: 'bank-0',
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountHolder: 'Siti Aisyah',
      },
    ]);
  });

  it('drops accounts with no number', () => {
    const json = JSON.stringify([{ bank: 'BCA', accountNumber: '' }]);
    expect(parseBankAccounts(json)).toEqual([]);
  });
});

describe('parseGalleryImages', () => {
  it('migrates a legacy array of bare URL strings', () => {
    const legacy = JSON.stringify(['https://img/1.jpg', 'https://img/2.jpg']);
    const images = parseGalleryImages(legacy);

    expect(images).toHaveLength(2);
    expect(images[0]).toEqual({ id: 'image-0', url: 'https://img/1.jpg', caption: undefined });
  });

  it('keeps captions from the canonical shape', () => {
    const json = JSON.stringify([{ id: 'g1', url: 'https://img/1.jpg', caption: 'Prewedding' }]);
    expect(parseGalleryImages(json)[0].caption).toBe('Prewedding');
  });

  it('drops entries without a url', () => {
    expect(parseGalleryImages(JSON.stringify([{ url: '' }, ''])).length).toBe(0);
  });
});

describe('parseLoveStory', () => {
  it('assigns ids to legacy entries missing one', () => {
    const legacy = JSON.stringify([
      { year: '2020', title: 'Bertemu', description: 'Di kampus' },
    ]);
    expect(parseLoveStory(legacy)[0].id).toBe('story-0');
  });

  it('drops entries with no title and no description', () => {
    const json = JSON.stringify([{ year: '2020', title: '', description: '' }]);
    expect(parseLoveStory(json)).toEqual([]);
  });
});

describe('parseSettings', () => {
  it('returns an object for valid settings', () => {
    expect(parseSettings('{"primaryColor":"#fff"}')).toEqual({ primaryColor: '#fff' });
  });

  it('returns an empty object for arrays, junk, or nothing', () => {
    expect(parseSettings('[]')).toEqual({});
    expect(parseSettings('nope')).toEqual({});
    expect(parseSettings(null)).toEqual({});
  });
});

describe('isSectionVisible', () => {
  it('defaults to visible when unset', () => {
    expect(isSectionVisible({}, 'showGallery')).toBe(true);
  });

  it('hides only on an explicit false', () => {
    expect(isSectionVisible({ showGallery: false }, 'showGallery')).toBe(false);
    expect(isSectionVisible({ showGallery: true }, 'showGallery')).toBe(true);
  });
});

describe('buildCalendarUrl', () => {
  it('builds a Google Calendar link from a complete event', () => {
    const url = buildCalendarUrl(
      {
        id: 'e1',
        name: 'Resepsi',
        date: '2026-09-12',
        startTime: '11:00',
        endTime: '14:00',
        venue: 'Gedung Melati',
        address: 'Jl. Mawar 1',
      },
      'Siti & Ahmad'
    );

    expect(url).toContain('calendar.google.com');
    expect(url).toContain('20260912T110000');
    expect(url).toContain('20260912T140000');
  });

  it('returns null when the date is missing or malformed', () => {
    const base = {
      id: 'e1',
      name: 'Resepsi',
      startTime: '11:00',
      venue: 'X',
      address: 'Y',
    };
    expect(buildCalendarUrl({ ...base, date: '' }, 'A & B')).toBeNull();
    expect(buildCalendarUrl({ ...base, date: '12-09' }, 'A & B')).toBeNull();
  });
});
