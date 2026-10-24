import { describe, expect, it } from "vitest";
import { WORKSPACE_ID } from "@/lib/defaults";
import { spendingByCategory } from "@/lib/domain/budgets";
import { forecast, lowestPoint } from "@/lib/domain/cashflow";
import { cycleFor } from "@/lib/domain/period";
import { toISODate } from "@/lib/format";
import {
  createDemoData,
  DEMO_LOW_POINT_DAYS,
  DEMO_SAFETY_THRESHOLD,
} from "@/lib/demo/seed";

// A spread of "todays", including month edges.
const days = [
  new Date(2026, 9, 24),
  new Date(2026, 9, 1),
  new Date(2027, 1, 28),
  new Date(2026, 11, 31),
  new Date(2027, 5, 15),
  new Date(2027, 7, 3),
];

function addDays(date: Date, n: number) {
  return toISODate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
}

describe.each(days)("createDemoData(%s)", (today) => {
  const data = createDemoData(today);
  const todayISO = toISODate(today);

  it("is deterministic for the same day", () => {
    expect(createDemoData(today)).toEqual(data);
  });

  it("marks past transactions actual and future ones expected", () => {
    for (const t of data.transactions) {
      expect(t.status).toBe(t.date <= todayISO ? "actual" : "expected");
    }
    expect(data.isDemo).toBe(true);
  });

  it("only references categories that exist", () => {
    const ids = new Set(data.categories.map((c) => c.id));
    for (const t of data.transactions) expect(ids.has(t.categoryId)).toBe(true);
  });

  it("puts family leisure over budget in the current cycle", () => {
    const cycle = cycleFor(today, 1);
    const spent = spendingByCategory(data.transactions, WORKSPACE_ID.family, cycle).get("family-leisure") ?? 0;
    const budget = data.categories.find((c) => c.id === "family-leisure")?.monthlyBudget ?? 0;
    expect(spent).toBeGreaterThan(budget);
  });

  it("has a positive family balance this cycle", () => {
    const cycle = cycleFor(today, 1);
    const net = data.transactions
      .filter((t) => t.workspaceId === WORKSPACE_ID.family && t.status === "actual" && t.date >= cycle.start && t.date <= cycle.end)
      .reduce((sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount), 0);
    expect(net).toBeGreaterThan(0);
  });

  it("has a client 35 days overdue", () => {
    const overdue = data.invoices.filter((i) => i.status !== "paid" && i.dueAt === addDays(today, -35));
    expect(overdue).toHaveLength(1);
  });

  it("links every owner's draw pair", () => {
    const byId = new Map(data.transactions.map((t) => [t.id, t]));
    const linked = data.transactions.filter((t) => t.linkedTransactionId);
    expect(linked.length).toBeGreaterThan(0);
    for (const t of linked) expect(byId.get(t.linkedTransactionId!)?.linkedTransactionId).toBe(t.id);
  });

  it("forecasts business cash dipping near, but not below, the safety threshold", () => {
    const low = lowestPoint(forecast(data.transactions, WORKSPACE_ID.business, todayISO, { pastDays: 0, days: 90 }))!;
    expect(low.balance).toBeGreaterThanOrEqual(DEMO_SAFETY_THRESHOLD);
    expect(low.balance).toBeLessThan(DEMO_SAFETY_THRESHOLD + 6_000_00);
    // The dip lands on the VAT payment or within the two weeks after it.
    expect(low.date >= addDays(today, DEMO_LOW_POINT_DAYS)).toBe(true);
    expect(low.date <= addDays(today, DEMO_LOW_POINT_DAYS + 14)).toBe(true);
  });
});

describe("createDemoData across a whole year", () => {
  it("keeps the forecast above the threshold and leisure over budget every day", () => {
    const failures: string[] = [];
    for (let i = 0; i < 366; i++) {
      const today = new Date(2026, 0, 1 + i);
      const todayISO = toISODate(today);
      const data = createDemoData(today);

      const min = lowestPoint(forecast(data.transactions, WORKSPACE_ID.business, todayISO, { pastDays: 0, days: 90 }))!.balance;
      if (min < DEMO_SAFETY_THRESHOLD || min >= DEMO_SAFETY_THRESHOLD + 6_000_00) {
        failures.push(`${todayISO}: forecast min ${min / 100}`);
      }

      const spent =
        spendingByCategory(data.transactions, WORKSPACE_ID.family, cycleFor(today, 1)).get("family-leisure") ?? 0;
      if (spent <= 800_00) failures.push(`${todayISO}: leisure ${spent / 100}`);
    }
    expect(failures).toEqual([]);
  });
});
