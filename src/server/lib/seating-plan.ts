/**
 * Pure seating arithmetic, kept free of Prisma so the capacity rules can be
 * tested directly. Over-seating a table is not something you want to discover
 * on the wedding day.
 */

export type PlanTable = { id: string; capacity: number };
export type PlanGuest = {
  id: string;
  groupName: string | null;
  rsvpGuestCount: number;
};

/** One RSVP row can bring several people; a missing count means one seat. */
export function headcount(guest: { rsvpGuestCount: number | null }): number {
  return guest.rsvpGuestCount || 1;
}

/** Sums the seats taken by a set of guests. */
export function seatsTaken(
  guests: Array<{ rsvpGuestCount: number | null }>
): number {
  return guests.reduce((sum, guest) => sum + headcount(guest), 0);
}

/** True when `incoming` more seats still fit within `capacity`. */
export function fitsInTable(
  occupied: number,
  incoming: number,
  capacity: number
): boolean {
  return occupied + incoming <= capacity;
}

/**
 * Assigns unseated guests to tables, keeping each group together where it fits.
 *
 * Guests are ordered by group so members land consecutively, then placed into
 * the first table with room. Anyone who doesn't fit is left unseated rather
 * than being split off — the planner decides what to do with the overflow.
 */
export function computeAutoArrangement(
  tables: PlanTable[],
  unseatedGuests: PlanGuest[],
  seatsAlreadyUsed: Record<string, number> = {}
): {
  assignments: Array<{ guestId: string; tableId: string }>;
  unseated: string[];
} {
  const remaining = new Map(
    tables.map((table) => [
      table.id,
      table.capacity - (seatsAlreadyUsed[table.id] ?? 0),
    ])
  );

  const ordered = [...unseatedGuests].sort((a, b) =>
    (a.groupName ?? '').localeCompare(b.groupName ?? '')
  );

  const assignments: Array<{ guestId: string; tableId: string }> = [];
  const unseated: string[] = [];

  for (const guest of ordered) {
    const heads = headcount(guest);
    const target = tables.find((table) => (remaining.get(table.id) ?? 0) >= heads);

    if (!target) {
      unseated.push(guest.id);
      continue;
    }

    remaining.set(target.id, (remaining.get(target.id) ?? 0) - heads);
    assignments.push({ guestId: guest.id, tableId: target.id });
  }

  return { assignments, unseated };
}
