import { toISODate } from "@/lib/format";
import type { Goal, Money } from "@/lib/types";

export type GoalStatus = "achieved" | "on-track" | "behind" | "open";

export interface GoalProgress {
  saved: Money;
  remaining: Money;
  /** 0–1 */
  ratio: number;
  /** Monthly amount needed to hit the deadline; null without one or once achieved. */
  monthlyNeeded: Money | null;
  status: GoalStatus;
}

function monthsBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm) + (td >= fd ? 0 : -1);
}

export function goalSaved(goal: Goal): Money {
  return goal.contributions.reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Progress against target and deadline. On track means the average of the
 * last three months' contributions covers what's still needed per month.
 */
export function goalProgress(goal: Goal, todayISO: string): GoalProgress {
  const saved = goalSaved(goal);
  const remaining = Math.max(0, goal.target - saved);
  const ratio = goal.target > 0 ? Math.min(1, saved / goal.target) : 0;

  if (remaining === 0) return { saved, remaining, ratio, monthlyNeeded: null, status: "achieved" };
  if (!goal.deadline) return { saved, remaining, ratio, monthlyNeeded: null, status: "open" };

  const monthsLeft = monthsBetween(todayISO, goal.deadline);
  if (monthsLeft < 0) return { saved, remaining, ratio, monthlyNeeded: remaining, status: "behind" };
  const monthlyNeeded = Math.ceil(remaining / Math.max(1, monthsLeft) / 100) * 100;

  const [y, m, d] = todayISO.split("-").map(Number);
  const threeMonthsAgo = toISODate(new Date(y, m - 4, d));
  const recent = goal.contributions
    .filter((c) => c.date > threeMonthsAgo && c.date <= todayISO)
    .reduce((sum, c) => sum + c.amount, 0);
  const status = recent / 3 >= monthlyNeeded ? "on-track" : "behind";
  return { saved, remaining, ratio, monthlyNeeded, status };
}

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  achieved: "הושג",
  "on-track": "בדרך",
  behind: "מאחר",
  open: "ללא תאריך יעד",
};
