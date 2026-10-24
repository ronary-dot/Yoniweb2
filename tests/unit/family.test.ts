import { describe, expect, it } from "vitest";
import { annualCost, nextPayment, paymentDates } from "@/lib/domain/activities";
import { goalProgress } from "@/lib/domain/goals";
import { familyInsights } from "@/lib/domain/insights";
import { settleDue } from "@/lib/domain/settle";
import { createDemoData } from "@/lib/demo/seed";
import { WORKSPACE_ID } from "@/lib/defaults";
import type { Activity, Goal, Transaction } from "@/lib/types";

const monthly: Activity = { id: "a1", member: "איתי", name: "כדורסל", cost: 280_00, frequency: "monthly" };
const semester: Activity = { id: "a2", member: "מאיה", name: "התעמלות", cost: 1_500_00, frequency: "semester" };
const yearly: Activity = { id: "a3", member: "נועה", name: "מנוי ספרייה", cost: 120_00, frequency: "yearly" };

describe("activities", () => {
  it("schedules monthly payments on the 10th", () => {
    expect(paymentDates(monthly, "2026-10-01", "2026-12-31")).toEqual(["2026-10-10", "2026-11-10", "2026-12-10"]);
    expect(paymentDates(monthly, "2026-10-11", "2026-11-30")).toEqual(["2026-11-10"]);
  });

  it("schedules semester fees in September and February", () => {
    expect(paymentDates(semester, "2026-01-01", "2026-12-31")).toEqual(["2026-02-10", "2026-09-10"]);
  });

  it("schedules yearly fees in September", () => {
    expect(paymentDates(yearly, "2026-01-01", "2027-12-31")).toEqual(["2026-09-10", "2027-09-10"]);
  });

  it("finds the next payment", () => {
    expect(nextPayment(semester, "2026-10-24")).toBe("2027-02-10");
    expect(nextPayment(monthly, "2026-10-10")).toBe("2026-10-10");
  });

  it("annualizes cost", () => {
    expect(annualCost(monthly)).toBe(3_360_00);
    expect(annualCost(semester)).toBe(3_000_00);
    expect(annualCost(yearly)).toBe(120_00);
  });
});

describe("goalProgress", () => {
  const base: Goal = { id: "g", workspaceId: "ws-family", name: "חופשה", target: 12_000_00, type: "saving", contributions: [] };
  const contrib = (dates: string[], amount: number) => dates.map((date) => ({ date, amount }));

  it("is achieved once contributions reach the target", () => {
    const p = goalProgress({ ...base, contributions: contrib(["2026-09-01"], 12_500_00) }, "2026-10-24");
    expect(p).toMatchObject({ status: "achieved", ratio: 1, remaining: 0, monthlyNeeded: null });
  });

  it("is open without a deadline", () => {
    expect(goalProgress(base, "2026-10-24").status).toBe("open");
  });

  it("computes the monthly amount needed and pace", () => {
    const goal = { ...base, deadline: "2027-04-24", contributions: contrib(["2026-08-03", "2026-09-03", "2026-10-03"], 1_000_00) };
    const p = goalProgress(goal, "2026-10-24");
    expect(p.monthlyNeeded).toBe(1_500_00); // 9,000 over 6 months
    expect(p.status).toBe("behind");
    const faster = { ...goal, contributions: contrib(["2026-08-03", "2026-09-03", "2026-10-03"], 2_000_00) };
    expect(goalProgress(faster, "2026-10-24").status).toBe("on-track");
  });

  it("is behind once the deadline has passed", () => {
    expect(goalProgress({ ...base, deadline: "2026-09-01" }, "2026-10-24").status).toBe("behind");
  });
});

describe("settleDue", () => {
  const tx = (partial: Partial<Transaction>): Transaction => ({
    id: Math.random().toString(),
    workspaceId: "ws-family",
    kind: "expense",
    amount: 100,
    categoryId: "c",
    date: "2026-10-20",
    status: "expected",
    createdAt: "",
    ...partial,
  });

  it("settles past-due expected transactions but not invoice payments", () => {
    const list = [tx({}), tx({ date: "2026-10-30" }), tx({ invoiceId: "inv" })];
    const settled = settleDue(list, "2026-10-24");
    expect(settled.map((t) => t.status)).toEqual(["actual", "expected", "expected"]);
  });

  it("returns the same array when nothing is due", () => {
    const list = [tx({ date: "2026-11-01" })];
    expect(settleDue(list, "2026-10-24")).toBe(list);
  });
});

describe("familyInsights on demo data", () => {
  it("flags the leisure overrun first", () => {
    const today = new Date(2026, 9, 24);
    const data = createDemoData(today);
    const insights = familyInsights({
      today,
      todayISO: "2026-10-24",
      cycleStartDay: 1,
      workspaceId: WORKSPACE_ID.family,
      transactions: data.transactions,
      categories: data.categories,
      activities: data.activities,
      goals: data.goals,
    });
    expect(insights[0]).toMatchObject({ id: "over-family-leisure", tone: "warning" });
  });

  it("mentions a semester fee due within a week", () => {
    const today = new Date(2027, 1, 5);
    const data = createDemoData(today);
    const insights = familyInsights({
      today,
      todayISO: "2027-02-05",
      cycleStartDay: 1,
      workspaceId: WORKSPACE_ID.family,
      transactions: data.transactions,
      categories: data.categories,
      activities: data.activities,
      goals: data.goals,
    });
    expect(insights.some((i) => i.tone === "info" && i.text.includes("התעמלות") && i.text.includes("5 ימים"))).toBe(true);
  });
});
