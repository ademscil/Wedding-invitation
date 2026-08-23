import { describe, it, expect } from 'vitest';
import {
  summarizeBudget,
  summarizeVendors,
  summarizeChecklist,
  type BudgetRow,
} from '@/server/lib/planner-summary';

const item = (over: Partial<BudgetRow> = {}): BudgetRow => ({
  estimatedCost: 0,
  actualCost: null,
  isPaid: false,
  ...over,
});

describe('summarizeBudget', () => {
  it('returns zeroes for an empty budget', () => {
    expect(summarizeBudget([])).toEqual({
      itemCount: 0,
      totalEstimated: 0,
      totalActual: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      variance: 0,
    });
  });

  it('falls back to the estimate when no actual cost is recorded', () => {
    const result = summarizeBudget([item({ estimatedCost: 5_000_000 })]);
    expect(result.totalActual).toBe(5_000_000);
    expect(result.variance).toBe(0);
  });

  it('prefers the actual cost once it is entered', () => {
    const result = summarizeBudget([
      item({ estimatedCost: 5_000_000, actualCost: 6_500_000 }),
    ]);
    expect(result.totalEstimated).toBe(5_000_000);
    expect(result.totalActual).toBe(6_500_000);
    expect(result.variance).toBe(1_500_000);
  });

  it('reports a negative variance when under budget', () => {
    const result = summarizeBudget([
      item({ estimatedCost: 10_000_000, actualCost: 8_000_000 }),
    ]);
    expect(result.variance).toBe(-2_000_000);
  });

  it('treats an actual cost of zero as real, not missing', () => {
    // A sponsored item genuinely costs 0 — it must not fall back to the estimate.
    const result = summarizeBudget([
      item({ estimatedCost: 3_000_000, actualCost: 0 }),
    ]);
    expect(result.totalActual).toBe(0);
    expect(result.variance).toBe(-3_000_000);
  });

  it('counts only paid items toward totalPaid', () => {
    const result = summarizeBudget([
      item({ estimatedCost: 1_000_000, isPaid: true }),
      item({ estimatedCost: 2_000_000, isPaid: false }),
    ]);
    expect(result.totalPaid).toBe(1_000_000);
    expect(result.totalOutstanding).toBe(2_000_000);
  });

  it('never reports negative outstanding when overpaid', () => {
    const result = summarizeBudget([
      item({ estimatedCost: 1_000_000, actualCost: 0, isPaid: true }),
    ]);
    expect(result.totalOutstanding).toBe(0);
  });
});

describe('summarizeVendors', () => {
  it('counts booked and paid vendors as secured', () => {
    const result = summarizeVendors([
      { status: 'BOOKED', price: 10_000_000 },
      { status: 'PAID', price: 5_000_000 },
      { status: 'CONTACTED', price: 3_000_000 },
      { status: 'CANCELLED', price: 9_000_000 },
    ]);

    expect(result.total).toBe(4);
    expect(result.booked).toBe(2);
    expect(result.paid).toBe(1);
    // Only secured vendors contribute to committed cost.
    expect(result.committedCost).toBe(15_000_000);
  });

  it('treats a missing price as zero', () => {
    const result = summarizeVendors([{ status: 'BOOKED', price: null }]);
    expect(result.committedCost).toBe(0);
  });

  it('handles an empty vendor list', () => {
    expect(summarizeVendors([])).toEqual({
      total: 0,
      booked: 0,
      paid: 0,
      committedCost: 0,
    });
  });
});

describe('summarizeChecklist', () => {
  const now = new Date('2026-08-06T00:00:00Z');
  const past = new Date('2026-08-01T00:00:00Z');
  const future = new Date('2026-09-01T00:00:00Z');

  it('reports 0% progress for an empty checklist without dividing by zero', () => {
    const result = summarizeChecklist([], now);
    expect(result.progress).toBe(0);
    expect(Number.isNaN(result.progress)).toBe(false);
  });

  it('computes rounded progress', () => {
    const result = summarizeChecklist(
      [
        { isDone: true, dueDate: null },
        { isDone: true, dueDate: null },
        { isDone: false, dueDate: null },
      ],
      now
    );
    expect(result.done).toBe(2);
    expect(result.progress).toBe(67);
  });

  it('flags only unfinished tasks past their due date', () => {
    const result = summarizeChecklist(
      [
        { isDone: false, dueDate: past },
        { isDone: true, dueDate: past },
        { isDone: false, dueDate: future },
        { isDone: false, dueDate: null },
      ],
      now
    );
    expect(result.overdue).toBe(1);
  });

  it('reaches 100% when everything is done', () => {
    const result = summarizeChecklist(
      [
        { isDone: true, dueDate: past },
        { isDone: true, dueDate: null },
      ],
      now
    );
    expect(result.progress).toBe(100);
    expect(result.overdue).toBe(0);
  });
});
