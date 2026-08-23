import { describe, it, expect } from 'vitest';
import {
  parseEvents,
  parseBankAccounts,
  parseGalleryImages,
  parseLoveStory,
  parseSettings,
  isSectionVisible,
  buildCalendarUrl,
  coupleNames,
  coupleInitials,
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

/**
 * Regression guard for the bug this module exists to fix: the editor and the
 * public templates once used different field names, so events, bank accounts,
 * gallery photos and love story entries were saved but never rendered.
 *
 * These tests assert the exact shapes the editor writes survive a round trip
 * with every field the templates read still populated.
 */
describe('editor to template round trip', () => {
  it('keeps every event field the template reads', () => {
    // Exactly what the editor serialises for a new event row.
    const written = JSON.stringify([
      {
        id: 'event-abc12345',
        name: 'Resepsi',
        date: '2026-09-12',
        startTime: '11:00',
        endTime: '14:00',
        venue: 'Gedung Melati',
        address: 'Jl. Mawar No. 1, Jakarta Selatan',
        mapUrl: 'https://maps.google.com/?q=melati',
      },
    ]);

    const [event] = parseEvents(written);

    expect(event.name).toBe('Resepsi');
    expect(event.startTime).toBe('11:00');
    expect(event.endTime).toBe('14:00');
    expect(event.venue).toBe('Gedung Melati');
    expect(event.address).toBe('Jl. Mawar No. 1, Jakarta Selatan');
    expect(event.mapUrl).toBe('https://maps.google.com/?q=melati');
    // A populated event must produce a working calendar link.
    expect(buildCalendarUrl(event, 'Siti & Ahmad')).toContain('20260912T110000');
  });

  it('keeps every bank account field the gift section reads', () => {
    const written = JSON.stringify([
      {
        id: 'bank-abc12345',
        bankName: 'BCA',
        accountHolder: 'Siti Aisyah',
        accountNumber: '1234567890',
      },
    ]);

    const [account] = parseBankAccounts(written);

    // These three are what BankCard renders; undefined here was the visible bug.
    expect(account.bankName).toBe('BCA');
    expect(account.accountHolder).toBe('Siti Aisyah');
    expect(account.accountNumber).toBe('1234567890');
    expect(account.id).toBeTruthy();
  });

  it('keeps gallery url and caption', () => {
    const written = JSON.stringify([
      { id: 'image-abc12345', url: 'https://img/1.jpg', caption: 'Prewedding' },
    ]);

    const [image] = parseGalleryImages(written);

    expect(image.url).toBe('https://img/1.jpg');
    expect(image.caption).toBe('Prewedding');
  });

  it('keeps love story fields and gives every entry a key', () => {
    const written = JSON.stringify([
      {
        id: 'story-abc12345',
        year: '2021',
        title: 'Pertama Bertemu',
        description: 'Di kampus',
        image: 'https://img/story.jpg',
      },
    ]);

    const [entry] = parseLoveStory(written);

    expect(entry.year).toBe('2021');
    expect(entry.title).toBe('Pertama Bertemu');
    expect(entry.description).toBe('Di kampus');
    expect(entry.image).toBe('https://img/story.jpg');
    expect(entry.id).toBeTruthy();
  });

  it('still renders invitations saved under the old field names', () => {
    // What the editor wrote before the fix.
    const legacyEvents = JSON.stringify([
      { name: 'Akad', date: '2026-09-12', time: '08:00', location: 'Masjid Al-Falah' },
    ]);
    const legacyBanks = JSON.stringify([
      { bank: 'Mandiri', accountName: 'Ahmad Rizky', accountNumber: '999' },
    ]);
    const legacyGallery = JSON.stringify(['https://img/old.jpg']);

    expect(parseEvents(legacyEvents)[0].startTime).toBe('08:00');
    expect(parseEvents(legacyEvents)[0].venue).toBe('Masjid Al-Falah');
    expect(parseBankAccounts(legacyBanks)[0].bankName).toBe('Mandiri');
    expect(parseBankAccounts(legacyBanks)[0].accountHolder).toBe('Ahmad Rizky');
    expect(parseGalleryImages(legacyGallery)[0].url).toBe('https://img/old.jpg');
  });
});

describe('coupleNames', () => {
  it('states the groom first, as an Indonesian invitation does', () => {
    expect(coupleNames({ brideName: 'Aisyah', groomName: 'Adam' })).toBe(
      'Adam & Aisyah'
    );
  });

  it('shows the single name it has rather than a dangling ampersand', () => {
    // Half-filled drafts are the normal state while someone is still typing.
    expect(coupleNames({ brideName: 'Aisyah', groomName: '' })).toBe('Aisyah');
    expect(coupleNames({ brideName: '', groomName: 'Adam' })).toBe('Adam');
    expect(coupleNames({ brideName: '   ', groomName: 'Adam' })).toBe('Adam');
    expect(coupleNames({ brideName: '', groomName: '' })).toBe('');
  });

  it('tolerates missing fields', () => {
    expect(coupleNames({})).toBe('');
    expect(coupleNames({ brideName: null, groomName: null })).toBe('');
    expect(coupleNames({ groomName: 'Adam' })).toBe('Adam');
  });

  it('trims stray whitespace around the names', () => {
    expect(coupleNames({ brideName: ' Aisyah ', groomName: ' Adam ' })).toBe(
      'Adam & Aisyah'
    );
  });
});

describe('coupleInitials', () => {
  it('puts the groom initial first and upper-cases both', () => {
    expect(coupleInitials({ brideName: 'aisyah', groomName: 'adam' })).toBe('A & A');
    expect(coupleInitials({ brideName: 'Nur', groomName: 'Budi' })).toBe('B & N');
  });

  it('falls back to the one initial available', () => {
    expect(coupleInitials({ brideName: 'Nur', groomName: '' })).toBe('N');
    expect(coupleInitials({})).toBe('');
  });
});
