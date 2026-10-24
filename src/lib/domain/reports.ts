import type { Category, Money, Transaction } from "@/lib/types";
import { spendingByCategory, totalsFor } from "./budgets";
import { type Cycle, shiftCycle } from "./period";

export interface MonthPoint {
  cycle: Cycle;
  income: Money;
  expense: Money;
  net: Money;
}

/** Totals for the last `count` cycles, oldest first, ending with the current one. */
export function monthlySeries(
  transactions: Transaction[],
  workspaceId: string,
  today: Date,
  startDay: number,
  count = 12,
): MonthPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const cycle = shiftCycle(today, startDay, i - count + 1);
    const { income, expense, balance } = totalsFor(transactions, workspaceId, cycle);
    return { cycle, income, expense, net: balance };
  });
}

export interface CategoryShare {
  id: string;
  name: string;
  amount: Money;
  /** 0–1 of the cycle's expenses */
  share: number;
}

/** Expense categories by size; anything past `top` folds into "אחר". */
export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  workspaceId: string,
  cycle: Cycle,
  top = 7,
): CategoryShare[] {
  const spent = spendingByCategory(transactions, workspaceId, cycle);
  const total = [...spent.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const sorted = [...spent]
    .sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => ({ id, name: names.get(id) ?? "ללא קטגוריה", amount, share: amount / total }));
  if (sorted.length <= top) return sorted;
  const rest = sorted.slice(top);
  const restAmount = rest.reduce((sum, c) => sum + c.amount, 0);
  return [...sorted.slice(0, top), { id: "other", name: `אחר (${rest.length})`, amount: restAmount, share: restAmount / total }];
}
