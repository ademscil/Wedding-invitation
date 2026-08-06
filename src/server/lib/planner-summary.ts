/**
 * Pure aggregation for the Event Planner dashboard.
 *
 * Kept free of Prisma so the money and progress arithmetic can be tested
 * directly — these numbers drive spending decisions, so they need to be right.
 */

export type BudgetRow = {
  estimatedCost: number;
  actualCost: number | null;
  isPaid: boolean;
};

export type VendorRow = {
  status: string;
  price: number | null;
};

export type ChecklistRow = {
  isDone: boolean;
  dueDate: Date | null;
};

/** A vendor counts as secured once it is booked or fully paid. */
const SECURED_STATUSES = new Set(['BOOKED', 'PAID']);

/** Falls back to the estimate until an actual figure is recorded. */
function effectiveCost(item: BudgetRow): number {
  return item.actualCost ?? item.estimatedCost;
}

export function summarizeBudget(items: BudgetRow[]) {
  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedCost, 0);
  const totalActual = items.reduce((sum, i) => sum + effectiveCost(i), 0);
  const totalPaid = items.reduce(
    (sum, i) => sum + (i.isPaid ? effectiveCost(i) : 0),
    0
  );

  return {
    itemCount: items.length,
    totalEstimated,
    totalActual,
    totalPaid,
    totalOutstanding: Math.max(0, totalActual - totalPaid),
    // Positive means the plan has run over its original estimate.
    variance: totalActual - totalEstimated,
  };
}

export function summarizeVendors(vendors: VendorRow[]) {
  const secured = vendors.filter((v) => SECURED_STATUSES.has(v.status));

  return {
    total: vendors.length,
    booked: secured.length,
    paid: vendors.filter((v) => v.status === 'PAID').length,
    committedCost: secured.reduce((sum, v) => sum + (v.price ?? 0), 0),
  };
}

export function summarizeChecklist(tasks: ChecklistRow[], now: Date = new Date()) {
  const done = tasks.filter((t) => t.isDone).length;
  const overdue = tasks.filter(
    (t) => !t.isDone && t.dueDate !== null && t.dueDate < now
  ).length;

  return {
    total: tasks.length,
    done,
    overdue,
    // Guard the empty case so an untouched planner reads 0%, not NaN.
    progress: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
  };
}
