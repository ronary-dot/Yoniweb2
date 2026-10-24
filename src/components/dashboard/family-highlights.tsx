"use client";

import clsx from "clsx";
import { Info, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { ProgressRing } from "@/components/ui/progress-ring";
import { WORKSPACE_ID } from "@/lib/defaults";
import { WEEKDAYS } from "@/lib/domain/activities";
import { goalProgress } from "@/lib/domain/goals";
import { familyInsights, type Insight } from "@/lib/domain/insights";
import { toISODate } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";

const toneIcon: Record<Insight["tone"], typeof Info> = { warning: TriangleAlert, info: Info, positive: Sparkles };
const toneClass: Record<Insight["tone"], string> = {
  warning: "text-warning",
  info: "text-accent",
  positive: "text-positive",
};

/** Family-only dashboard rows: insights, savings goals, the coming week's activities (SPEC §5.1). */
export function FamilyHighlights() {
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const activities = useAppStore((s) => s.activities);
  const goals = useAppStore((s) => s.goals);
  const cycleStartDay = useAppStore((s) => s.workspaces.find((w) => w.mode === "family")?.cycleStartDay ?? 1);

  const today = new Date();
  const todayISO = toISODate(today);
  const insights = familyInsights({
    today,
    todayISO,
    cycleStartDay,
    workspaceId: WORKSPACE_ID.family,
    transactions,
    categories,
    activities,
    goals,
  }).slice(0, 3);

  const savingGoals = goals.filter((g) => g.workspaceId === WORKSPACE_ID.family).slice(0, 3);

  // Sessions over the coming seven days, starting today.
  const weekday = today.getDay();
  const thisWeek = activities
    .flatMap((a) => (a.schedule ?? []).map((s) => ({ a, s, inDays: (s.weekday - weekday + 7) % 7 })))
    .sort((x, y) => x.inDays - y.inDays || x.s.time.localeCompare(y.s.time));

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <Card>
        <h2 className="mb-4 text-[15px] font-medium">תובנות</h2>
        <ul className="flex flex-col gap-3">
          {insights.map((insight) => {
            const Icon = toneIcon[insight.tone];
            return (
              <li key={insight.id} className="flex gap-2.5 text-sm">
                <Icon aria-hidden strokeWidth={1.75} className={clsx("mt-0.5 size-4 shrink-0", toneClass[insight.tone])} />
                <span>{insight.text}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium">יעדי חיסכון</h2>
          <Link href="/family/goals" className="text-sm text-fg-muted transition-colors duration-150 hover:text-accent">
            הכל
          </Link>
        </div>
        {savingGoals.length === 0 ? (
          <p className="text-sm text-fg-muted">עדיין אין יעדים.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {savingGoals.map((g) => {
              const p = goalProgress(g, todayISO);
              return (
                <li key={g.id} className="flex items-center gap-3">
                  <ProgressRing value={p.ratio} size={40} stroke={4} achieved={p.status === "achieved"}>
                    <span aria-hidden className="text-sm">{g.emoji}</span>
                  </ProgressRing>
                  <span className="min-w-0 flex-1">
                    <span className="block min-w-0 truncate text-sm font-medium">{g.name}</span>
                    <span className="block text-xs text-fg-muted">
                      <Money value={p.saved} /> מתוך <Money value={g.target} />
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">{Math.round(p.ratio * 100)}%</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium">חוגים בשבוע הקרוב</h2>
          <Link href="/family/activities" className="text-sm text-fg-muted transition-colors duration-150 hover:text-accent">
            הכל
          </Link>
        </div>
        {thisWeek.length === 0 ? (
          <p className="text-sm text-fg-muted">אין חוגים עם ימים קבועים.</p>
        ) : (
          <ul className="flex flex-col gap-2.5 text-sm">
            {thisWeek.slice(0, 5).map(({ a, s, inDays }) => (
              <li key={`${a.id}-${s.weekday}`} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate">
                  {a.name} <span className="text-fg-muted">· {a.member}</span>
                </span>
                <span className="shrink-0 text-xs text-fg-muted tabular-nums">
                  {inDays === 0 ? "היום" : inDays === 1 ? "מחר" : `יום ${WEEKDAYS[s.weekday]}`} {s.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
