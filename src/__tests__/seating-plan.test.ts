import { describe, it, expect } from 'vitest';
import {
  headcount,
  seatsTaken,
  fitsInTable,
  computeAutoArrangement,
  type PlanGuest,
} from '@/server/lib/seating-plan';

const guest = (
  id: string,
  groupName: string | null,
  rsvpGuestCount = 1
): PlanGuest => ({ id, groupName, rsvpGuestCount });

describe('headcount', () => {
  it('counts the RSVP party size', () => {
    expect(headcount({ rsvpGuestCount: 3 })).toBe(3);
  });

  it('treats a missing or zero count as one seat', () => {
    expect(headcount({ rsvpGuestCount: null })).toBe(1);
    expect(headcount({ rsvpGuestCount: 0 })).toBe(1);
  });
});

describe('seatsTaken', () => {
  it('sums party sizes rather than counting rows', () => {
    expect(
      seatsTaken([{ rsvpGuestCount: 2 }, { rsvpGuestCount: 3 }])
    ).toBe(5);
  });

  it('is zero for no guests', () => {
    expect(seatsTaken([])).toBe(0);
  });
});

describe('fitsInTable', () => {
  it('allows filling a table exactly to capacity', () => {
    expect(fitsInTable(6, 2, 8)).toBe(true);
  });

  it('rejects going one seat over', () => {
    expect(fitsInTable(7, 2, 8)).toBe(false);
  });

  it('rejects a party larger than an empty table', () => {
    expect(fitsInTable(0, 9, 8)).toBe(false);
  });
});

describe('computeAutoArrangement', () => {
  it('seats everyone when there is room', () => {
    const result = computeAutoArrangement(
      [{ id: 't1', capacity: 8 }],
      [guest('g1', 'Keluarga'), guest('g2', 'Keluarga')]
    );

    expect(result.assignments).toHaveLength(2);
    expect(result.unseated).toHaveLength(0);
    expect(result.assignments.every((a) => a.tableId === 't1')).toBe(true);
  });

  it('never exceeds a table capacity', () => {
    const result = computeAutoArrangement(
      [{ id: 't1', capacity: 2 }],
      [guest('g1', null), guest('g2', null), guest('g3', null)]
    );

    expect(result.assignments.filter((a) => a.tableId === 't1')).toHaveLength(2);
    expect(result.unseated).toEqual(['g3']);
  });

  it('respects seats already used by previously seated guests', () => {
    const result = computeAutoArrangement(
      [{ id: 't1', capacity: 8 }],
      [guest('g1', null, 3)],
      { t1: 6 } // only 2 seats left, party of 3 does not fit
    );

    expect(result.assignments).toHaveLength(0);
    expect(result.unseated).toEqual(['g1']);
  });

  it('counts party size, not guest rows, against capacity', () => {
    const result = computeAutoArrangement(
      [{ id: 't1', capacity: 4 }],
      [guest('g1', null, 3), guest('g2', null, 2)]
    );

    // g1 takes 3 of 4 seats; g2 needs 2 and cannot fit.
    expect(result.assignments).toEqual([{ guestId: 'g1', tableId: 't1' }]);
    expect(result.unseated).toEqual(['g2']);
  });

  it('keeps a group together on the same table when it fits', () => {
    const result = computeAutoArrangement(
      [
        { id: 't1', capacity: 2 },
        { id: 't2', capacity: 4 },
      ],
      [
        guest('a1', 'Kantor'),
        guest('b1', 'Keluarga'),
        guest('a2', 'Kantor'),
        guest('b2', 'Keluarga'),
      ]
    );

    const tableOf = (id: string) =>
      result.assignments.find((a) => a.guestId === id)?.tableId;

    // Sorting by group puts Kantor first into t1, Keluarga then lands in t2.
    expect(tableOf('a1')).toBe(tableOf('a2'));
    expect(tableOf('b1')).toBe(tableOf('b2'));
  });

  it('overflows to the next table once the first is full', () => {
    const result = computeAutoArrangement(
      [
        { id: 't1', capacity: 1 },
        { id: 't2', capacity: 1 },
      ],
      [guest('g1', null), guest('g2', null)]
    );

    const tables = result.assignments.map((a) => a.tableId).sort();
    expect(tables).toEqual(['t1', 't2']);
    expect(result.unseated).toHaveLength(0);
  });

  it('leaves every guest unseated when there are no tables', () => {
    const result = computeAutoArrangement([], [guest('g1', null)]);
    expect(result.assignments).toHaveLength(0);
    expect(result.unseated).toEqual(['g1']);
  });

  it('does not mutate the guest list it was given', () => {
    const guests = [guest('g2', 'Zeta'), guest('g1', 'Alpha')];
    computeAutoArrangement([{ id: 't1', capacity: 8 }], guests);
    expect(guests.map((g) => g.id)).toEqual(['g2', 'g1']);
  });
});
