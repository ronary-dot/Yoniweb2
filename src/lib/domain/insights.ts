import { formatMoney } from "@/lib/format";
import type { Activity, Category, Goal, Transaction } from "@/lib/types";
import { nextPayment } from "./activities";
import { spendingByCategory } from "./budgets";
import { goalProgress } from "./goals";
import { type Cycle, daysLeft, shiftCycle } from "./period";

export interface Insight {
  id: string;
  tone: "warning" | "info" | "positive";
  text: string;
}

interface FamilyInsightInput {
  today: Date;
  todayISO: string;
  cycleStartDay: number;
  workspaceId: string;
  transactions: Transaction[];
  categories: Category[];
  activities: Activity[];
  goals: Goal[];
}

/** Rule-based family insights, most important first (SPEC §7). */
export function familyInsights(input: FamilyInsightInput): Insight[] {
  const { today, todayISO, cycleStartDay, workspaceId, transactions, categories, activities, goals } = input;
  const insights: Insight[] = [];
  const cycle = shiftCycle(today, cycleStartDay, 0);
  const spent = spendingByCategory(transactions, workspaceId, cycle);
  const own = categories.filter((c) => c.workspaceId === workspaceId && c.kind === "expense" && !c.archived);

  // Over budget.
  for (const c of own) {
    const amount = spent.get(c.id) ?? 0;
    if (c.monthlyBudget && amount > c.monthlyBudget) {
      insights.push({
        id: `over-${c.id}`,
        tone: "warning",
        text: `חרגתם מהתקציב של ${c.name} ב-${formatMoney(amount - c.monthlyBudget)}`,
      });
    }
  }

  // Well above the recent average (only categories not already flagged).
  const previous: Cycle[] = [1, 2, 3].map((n) => shiftCycle(today, cycleStartDay, -n));
  const history = previous.map((p) => spendingByCategory(transactions, workspaceId, p));
  for (const c of own) {
    if (insights.some((i) => i.id === `over-${c.id}`)) continue;
    const amount = spent.get(c.id) ?? 0;
    const average = history.reduce((sum, h) => sum + (h.get(c.id) ?? 0), 0) / history.length;
    if (average > 0 && amount >= average * 1.25 && amount - average >= 150_00) {
      insights.push({
        id: `above-${c.id}`,
        tone: "warning",
        text: `ההוצאה על ${c.name} גבוהה ב-${Math.round((amount / average - 1) * 100)}% מהממוצע`,
      });
    }
  }

  // Semester or yearly fees coming up within a week (monthly ones are routine).
  for (const a of activities) {
    if (a.frequency === "monthly") continue;
    const next = nextPayment(a, todayISO);
    if (!next) continue;
    const days = daysLeft(today, { start: todayISO, end: next }) - 1;
    if (days <= 7) {
      insights.push({
        id: `activity-${a.id}`,
        tone: "info",
        text: `${a.name} של ${a.member} מתחדש ${days === 0 ? "היום" : `בעוד ${days} ימים`} (${formatMoney(a.cost)})`,
      });
    }
  }

  for (const g of goals.filter((g) => g.workspaceId === workspaceId)) {
    const progress = goalProgress(g, todayISO);
    if (progress.status === "behind" && progress.monthlyNeeded) {
      insights.push({
        id: `goal-${g.id}`,
        tone: "info",
        text: `כדי להגיע ליעד "${g.name}" בזמן, צריך לחסוך ${formatMoney(progress.monthlyNeeded)} בחודש`,
      });
    }
  }

  const left = daysLeft(today, cycle);
  if (insights.length === 0 && left > 0) {
    insights.push({ id: "calm", tone: "positive", text: "הכל במסגרת התקציב. המשיכו כך." });
  }
  return insights;
}
