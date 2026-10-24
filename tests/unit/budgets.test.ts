import { describe, expect, it } from "vitest";
import { budgetStatus, recentCategoryIds, spendingByCategory, totalsFor } from "@/lib/domain/budgets";
import type { Transaction } from "@/lib/types";

const cycle = { start: "2026-10-01", end: "2026-10-31" };

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    workspaceId: "ws-family",
    kind: "expense",
    amount: 100_00,
    categoryId: "groceries",
    date: "2026-10-10",
    status: "actual",
    createdAt: "2026-10-10T10:00:00.000Z",
    ...partial,
  };
}

const transactions = [
  tx({ kind: "income", amount: 10_000_00, categoryId: "salary" }),
  tx({ amount: 250_00 }),
  tx({ amount: 150_00, categoryId: "leisure" }),
  tx({ amount: 999_00, date: "2026-09-30" }), // previous cycle
  tx({ amount: 999_00, status: "expected" }), // not yet happened
  tx({ amount: 999_00, workspaceId: "ws-business" }), // other mode
];

describe("totalsFor", () => {
  it("sums only actual transactions of the workspace within the cycle", () => {
    expect(totalsFor(transactions, "ws-family", cycle)).toEqual({
      income: 10_000_00,
      expense: 400_00,
      balance: 9_600_00,
    });
  });
});

describe("spendingByCategory", () => {
  it("groups expenses by category", () => {
    const spent = spendingByCategory(transactions, "ws-family", cycle);
    expect(spent.get("groceries")).toBe(250_00);
    expect(spent.get("leisure")).toBe(150_00);
    expect(spent.has("salary")).toBe(false);
  });
});

describe("budgetStatus", () => {
  it("classifies spending against a budget", () => {
    expect(budgetStatus(500, undefined)).toBe("none");
    expect(budgetStatus(500, 1000)).toBe("ok");
    expect(budgetStatus(850, 1000)).toBe("warning");
    expect(budgetStatus(1000, 1000)).toBe("warning");
    expect(budgetStatus(1001, 1000)).toBe("over");
  });
});

describe("recentCategoryIds", () => {
  it("orders by most recent use without duplicates", () => {
    const list = [
      tx({ categoryId: "a", createdAt: "2026-10-01T00:00:00Z" }),
      tx({ categoryId: "b", createdAt: "2026-10-03T00:00:00Z" }),
      tx({ categoryId: "a", createdAt: "2026-10-05T00:00:00Z" }),
    ];
    expect(recentCategoryIds(list, "ws-family")).toEqual(["a", "b"]);
  });
});
