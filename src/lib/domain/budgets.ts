import type { Money, Transaction } from "@/lib/types";
import { type Cycle, inCycle } from "./period";

export interface Totals {
  income: Money;
  expense: Money;
  balance: Money;
}

function actualInCycle(transactions: Transaction[], workspaceId: string, cycle: Cycle) {
  return transactions.filter(
    (t) => t.workspaceId === workspaceId && t.status === "actual" && inCycle(t.date, cycle),
  );
}

export function totalsFor(transactions: Transaction[], workspaceId: string, cycle: Cycle): Totals {
  let income = 0;
  let expense = 0;
  for (const t of actualInCycle(transactions, workspaceId, cycle)) {
    if (t.kind === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

/** Actual spending per expense category within the cycle. */
export function spendingByCategory(
  transactions: Transaction[],
  workspaceId: string,
  cycle: Cycle,
): Map<string, Money> {
  const spent = new Map<string, Money>();
  for (const t of actualInCycle(transactions, workspaceId, cycle)) {
    if (t.kind !== "expense") continue;
    spent.set(t.categoryId, (spent.get(t.categoryId) ?? 0) + t.amount);
  }
  return spent;
}

export type BudgetStatus = "none" | "ok" | "warning" | "over";

/** Warning from 85% of the budget; over once spending exceeds it. */
export function budgetStatus(spent: Money, budget: Money | undefined): BudgetStatus {
  if (!budget) return "none";
  if (spent > budget) return "over";
  if (spent >= budget * 0.85) return "warning";
  return "ok";
}

/** Category ids ordered by most recent use, for the quick-pick grid. */
export function recentCategoryIds(transactions: Transaction[], workspaceId: string): string[] {
  const seen = new Set<string>();
  const sorted = transactions
    .filter((t) => t.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const t of sorted) seen.add(t.categoryId);
  return [...seen];
}
