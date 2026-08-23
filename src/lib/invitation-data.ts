import type {
  BankAccount,
  GalleryImage,
  InvitationEvent,
  InvitationSettings,
  LoveStoryEntry,
} from '@/types';

/**
 * Parsers for the JSON columns on Invitation.
 *
 * Earlier builds of the editor wrote a different field naming than the
 * templates read, so every parser accepts both the legacy and the canonical
 * shape and always returns the canonical one. That keeps invitations created
 * before the fix rendering correctly without a data migration.
 */

function safeParseArray(json: string | null | undefined): unknown[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function optionalStr(value: unknown): string | undefined {
  const s = str(value);
  return s.trim() === '' ? undefined : s;
}

/** Stable fallback id so React keys never collide when data predates ids. */
function idAt(raw: Record<string, unknown>, prefix: string, index: number): string {
  return optionalStr(raw.id) ?? `${prefix}-${index}`;
}

export function parseEvents(json: string | null | undefined): InvitationEvent[] {
  return safeParseArray(json)
    .map((item, index) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      return {
        id: idAt(raw, 'event', index),
        name: str(raw.name),
        date: str(raw.date),
        // Legacy editor stored a single `time`; canonical splits start/end.
        startTime: str(raw.startTime) || str(raw.time),
        endTime: optionalStr(raw.endTime),
        // Legacy editor stored one `location`; canonical splits venue/address.
        venue: str(raw.venue) || str(raw.location),
        address: str(raw.address) || (raw.venue ? str(raw.location) : ''),
        mapUrl: optionalStr(raw.mapUrl),
      };
    })
    .filter((event) => event.name.trim() !== '' || event.date.trim() !== '');
}

export function parseBankAccounts(json: string | null | undefined): BankAccount[] {
  return safeParseArray(json)
    .map((item, index) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      return {
        id: idAt(raw, 'bank', index),
        bankName: str(raw.bankName) || str(raw.bank),
        accountNumber: str(raw.accountNumber),
        accountHolder: str(raw.accountHolder) || str(raw.accountName),
      };
    })
    .filter((account) => account.accountNumber.trim() !== '');
}

export function parseGalleryImages(json: string | null | undefined): GalleryImage[] {
  return safeParseArray(json)
    .map((item, index) => {
      // Legacy editor stored bare URL strings.
      if (typeof item === 'string') {
        return { id: `image-${index}`, url: item, caption: undefined };
      }
      const raw = (item ?? {}) as Record<string, unknown>;
      return {
        id: idAt(raw, 'image', index),
        url: str(raw.url),
        caption: optionalStr(raw.caption),
      };
    })
    .filter((image) => image.url.trim() !== '');
}

export function parseLoveStory(json: string | null | undefined): LoveStoryEntry[] {
  return safeParseArray(json)
    .map((item, index) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      return {
        id: idAt(raw, 'story', index),
        year: str(raw.year),
        title: str(raw.title),
        description: str(raw.description),
        image: optionalStr(raw.image),
      };
    })
    .filter((entry) => entry.title.trim() !== '' || entry.description.trim() !== '');
}

export function parseSettings(json: string | null | undefined): InvitationSettings {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as InvitationSettings)
      : {};
  } catch {
    return {};
  }
}

/** Section visibility defaults to on, so an empty settings object shows everything. */
export function isSectionVisible(
  settings: InvitationSettings,
  key: keyof InvitationSettings
): boolean {
  return settings[key] !== false;
}

/** Builds a Google Calendar "add event" URL for an event entry. */
export function buildCalendarUrl(
  event: InvitationEvent,
  coupleNames: string
): string | null {
  if (!event.date) return null;

  const compactDate = event.date.replace(/-/g, '');
  if (compactDate.length !== 8) return null;

  const start = `${compactDate}T${(event.startTime || '00:00').replace(/:/g, '')}00`;
  const end = event.endTime
    ? `${compactDate}T${event.endTime.replace(/:/g, '')}00`
    : `${compactDate}T${String(
        Math.min(23, Number((event.startTime || '00:00').split(':')[0]) + 2)
      ).padStart(2, '0')}0000`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.name || 'Acara Pernikahan'} - ${coupleNames}`,
    dates: `${start}/${end}`,
    details: `Undangan pernikahan ${coupleNames}`,
    location: [event.venue, event.address].filter(Boolean).join(', '),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
