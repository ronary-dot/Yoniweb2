import type { Transaction } from "@/lib/types";

/**
 * Expected transactions whose date has arrived become actual: fixed costs,
 * salaries and activity fees happen on their own. Invoice payments are the
 * exception — they stay expected until the client actually pays (SPEC §6.3).
 * Returns the same array when nothing changed.
 */
export function settleDue(transactions: Transaction[], todayISO: string): Transaction[] {
  const due = (t: Transaction) => t.status === "expected" && t.date <= todayISO && !t.invoiceId;
  if (!transactions.some(due)) return transactions;
  return transactions.map((t) => (due(t) ? { ...t, status: "actual" } : t));
}
