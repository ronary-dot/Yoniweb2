import { toISODate } from "@/lib/format";
import type { Money, Transaction } from "@/lib/types";

export interface CashPoint {
  date: string;
  /** Balance from actual transactions; only for today and earlier. */
  actual?: Money;
  /** Projected balance; only for today and later. */
  projected?: Money;
}

const signed = (t: Transaction) => (t.kind === "income" ? t.amount : -t.amount);

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

/** Cash on hand: every actual transaction up to and including today. */
export function cashOnHand(transactions: Transaction[], workspaceId: string, todayISO: string): Money {
  return transactions
    .filter((t) => t.workspaceId === workspaceId && t.status === "actual" && t.date <= todayISO)
    .reduce((sum, t) => sum + signed(t), 0);
}

export interface ForecastOptions {
  /** Days of history before today. */
  pastDays?: number;
  /** Days projected after today. */
  days?: number;
  /** Expected transactions to push later ("what if", SPEC §6.2). */
  postponed?: ReadonlySet<string>;
  postponeDays?: number;
}

/**
 * Daily cash balance: history from actual transactions, then a projection
 * that adds everything still to come. Expected items already past due —
 * a late client, say — are left out: money that hasn't arrived isn't
 * counted on until it does.
 */
export function forecast(
  transactions: Transaction[],
  workspaceId: string,
  todayISO: string,
  { pastDays = 30, days = 90, postponed, postponeDays = 30 }: ForecastOptions = {},
): CashPoint[] {
  const own = transactions.filter((t) => t.workspaceId === workspaceId);
  const actual = own.filter((t) => t.status === "actual" && t.date <= todayISO);
  const upcoming = own
    .filter((t) => t.date > todayISO || (t.status === "expected" && t.date === todayISO))
    .map((t) => ({ amount: signed(t), date: postponed?.has(t.id) ? addDays(t.date, postponeDays) : t.date }));

  const deltaByDate = (items: { date: string; amount: Money }[]) => {
    const map = new Map<string, Money>();
    for (const i of items) map.set(i.date, (map.get(i.date) ?? 0) + i.amount);
    return map;
  };

  const start = addDays(todayISO, -pastDays);
  const pastDeltas = deltaByDate(actual.map((t) => ({ date: t.date, amount: signed(t) })));
  let balance = actual.filter((t) => t.date < start).reduce((sum, t) => sum + signed(t), 0);

  const points: CashPoint[] = [];
  for (let i = -pastDays; i <= 0; i++) {
    const date = addDays(todayISO, i);
    balance += pastDeltas.get(date) ?? 0;
    points.push({ date, actual: balance });
  }

  const futureDeltas = deltaByDate(upcoming);
  // Items due today (expected) land on today's projected point.
  let projected = balance + (futureDeltas.get(todayISO) ?? 0);
  points[points.length - 1].projected = projected;
  for (let i = 1; i <= days; i++) {
    const date = addDays(todayISO, i);
    projected += futureDeltas.get(date) ?? 0;
    points.push({ date, projected });
  }
  return points;
}

/** The lowest projected point, today onwards. */
export function lowestPoint(points: CashPoint[]): { date: string; balance: Money } | null {
  let lowest: { date: string; balance: Money } | null = null;
  for (const p of points) {
    if (p.projected === undefined) continue;
    if (!lowest || p.projected < lowest.balance) lowest = { date: p.date, balance: p.projected };
  }
  return lowest;
}
