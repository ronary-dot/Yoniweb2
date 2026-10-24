import { describe, expect, it } from "vitest";
import { createDemoData } from "@/lib/demo/seed";
import { WORKSPACE_ID } from "@/lib/defaults";
import { cycleFor } from "@/lib/domain/period";
import { categoryBreakdown, monthlySeries } from "@/lib/domain/reports";

const today = new Date(2026, 9, 24);
const data = createDemoData(today);

describe("monthlySeries", () => {
  it("returns twelve cycles ending with the current one", () => {
    const series = monthlySeries(data.transactions, WORKSPACE_ID.family, today, 1);
    expect(series).toHaveLength(12);
    expect(series.at(-1)!.cycle.start).toBe("2026-10-01");
    expect(series[0].cycle.start).toBe("2025-11-01");
    for (const p of series) expect(p.net).toBe(p.income - p.expense);
    // The demo covers six months back, so the oldest months are empty.
    expect(series[0].income).toBe(0);
    expect(series.at(-2)!.income).toBeGreaterThan(0);
  });
});

describe("categoryBreakdown", () => {
  it("ranks categories, sums to the whole and folds the tail", () => {
    const rows = categoryBreakdown(data.transactions, data.categories, WORKSPACE_ID.family, cycleFor(today, 1), 4);
    expect(rows).toHaveLength(5);
    expect(rows.at(-1)!.id).toBe("other");
    expect(rows.slice(0, 4).every((r, i, a) => i === 0 || a[i - 1].amount >= r.amount)).toBe(true);
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 10);
  });

  it("is empty without spending", () => {
    expect(categoryBreakdown([], data.categories, WORKSPACE_ID.family, cycleFor(today, 1))).toEqual([]);
  });
});
