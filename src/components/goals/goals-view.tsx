"use client";

import clsx from "clsx";
import { Plus, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Sheet } from "@/components/ui/sheet";
import { useCycle } from "@/hooks/use-cycle";
import { celebrate } from "@/lib/confetti";
import { WORKSPACE_ID } from "@/lib/defaults";
import { totalsFor } from "@/lib/domain/budgets";
import { GOAL_STATUS_LABEL, type GoalProgress, type GoalStatus, goalProgress } from "@/lib/domain/goals";
import { toISODate } from "@/lib/format";
import { snapshotData, useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { Goal, Mode } from "@/lib/types";
import { ContributeForm, GoalForm } from "./goal-forms";

type SheetState = { kind: "new" } | { kind: "edit"; goal: Goal } | { kind: "contribute"; goal: Goal };

const monthYear = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });

export function GoalsView({ mode }: { mode: Mode }) {
  const hydrated = useHasHydrated();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [open, setOpen] = useState(false);

  const show = (next: SheetState) => {
    setSheet(next);
    setOpen(true);
  };

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">יעדים</h1>
        <Button size="sm" onClick={() => show({ kind: "new" })}>
          <Plus aria-hidden className="size-4" />
          יעד חדש
        </Button>
      </header>
      {hydrated && <GoalsContent mode={mode} onShow={show} />}
      {hydrated && <GoalSheet mode={mode} sheet={sheet} open={open} onOpenChange={setOpen} />}
    </>
  );
}

/** Revenue goals measure this cycle's income; the rest measure deposits. */
function useGoalProgress(mode: Mode) {
  const transactions = useAppStore((s) => s.transactions);
  const cycle = useCycle(mode);
  const income = useMemo(() => totalsFor(transactions, WORKSPACE_ID[mode], cycle).income, [transactions, mode, cycle]);
  return (goal: Goal): GoalProgress => {
    const todayISO = toISODate(new Date());
    if (goal.type !== "revenue") return goalProgress(goal, todayISO);
    const ratio = Math.min(1, income / goal.target);
    return {
      saved: income,
      remaining: Math.max(0, goal.target - income),
      ratio,
      monthlyNeeded: null,
      status: income >= goal.target ? "achieved" : "open",
    };
  };
}

function GoalsContent({ mode, onShow }: { mode: Mode; onShow: (s: SheetState) => void }) {
  const goals = useAppStore((s) => s.goals);
  const progressOf = useGoalProgress(mode);
  const own = goals.filter((g) => g.workspaceId === WORKSPACE_ID[mode]);

  if (own.length === 0) {
    return (
      <EmptyState icon={Target} title="אין עדיין יעדים">
        {mode === "family" ? "חופשה, קרן חירום או מתנה גדולה — כל יעד מתחיל בצעד אחד." : "יעד הכנסות חודשי או רזרבת ביטחון לעסק."}
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {own.map((goal) => (
        <GoalCard key={goal.id} goal={goal} progress={progressOf(goal)} onShow={onShow} />
      ))}
    </div>
  );
}

const statusTone: Record<GoalStatus, string> = {
  achieved: "bg-positive/12 text-positive",
  "on-track": "bg-accent-soft text-accent",
  behind: "bg-warning/15 text-warning",
  open: "bg-hover text-fg-muted",
};

function GoalCard({ goal, progress, onShow }: { goal: Goal; progress: GoalProgress; onShow: (s: SheetState) => void }) {
  const achieved = progress.status === "achieved";
  const [y, m, d] = goal.deadline?.split("-").map(Number) ?? [];
  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-4">
        <ProgressRing value={progress.ratio} size={68} achieved={achieved}>
          <span className="text-sm font-semibold tabular-nums">{Math.round(progress.ratio * 100)}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 font-medium">
            {goal.emoji && <span aria-hidden>{goal.emoji}</span>}
            <span className="min-w-0 truncate">{goal.name}</span>
          </h2>
          <span className={clsx("mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium", statusTone[progress.status])}>
            {goal.type === "revenue" && !achieved ? "החודש" : GOAL_STATUS_LABEL[progress.status]}
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm">
        <Money value={progress.saved} className="font-semibold" />
        <span className="text-fg-muted"> מתוך </span>
        <Money value={goal.target} className="text-fg-muted" />
      </p>
      <p className="mt-0.5 min-h-5 text-xs text-fg-muted">
        {progress.monthlyNeeded && !achieved ? (
          <>
            כדי להגיע בזמן: <Money value={progress.monthlyNeeded} /> בחודש
          </>
        ) : goal.deadline && !achieved ? (
          `עד ${monthYear.format(new Date(y, m - 1, d))}`
        ) : null}
      </p>
      <div className="mt-4 flex gap-2">
        {goal.type !== "revenue" && !achieved && (
          <Button variant="primary" size="sm" onClick={() => onShow({ kind: "contribute", goal })}>
            הפקדה
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onShow({ kind: "edit", goal })}>
          עריכה
        </Button>
      </div>
    </Card>
  );
}

function GoalSheet({
  mode,
  sheet,
  open,
  onOpenChange,
}: {
  mode: Mode;
  sheet: SheetState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const contributeToGoal = useAppStore((s) => s.contributeToGoal);
  const progressOf = useGoalProgress(mode);
  const close = () => onOpenChange(false);
  const workspaceId = WORKSPACE_ID[mode];

  const title = !sheet ? "" : sheet.kind === "new" ? "יעד חדש" : sheet.kind === "edit" ? "עריכת יעד" : `הפקדה ל${sheet.goal.name}`;

  function contribute(goal: Goal, amount: number) {
    const before = progressOf(goal).status;
    contributeToGoal(goal.id, amount);
    close();
    const updated = useAppStore.getState().goals.find((g) => g.id === goal.id);
    // The one celebration in the app: a goal just reached (SPEC §5.5).
    if (updated && before !== "achieved" && progressOf(updated).status === "achieved") {
      celebrate();
      toast(`הגעתם ליעד "${goal.name}"! 🎉`);
    }
  }

  function remove(goal: Goal) {
    const before = snapshotData();
    deleteGoal(goal.id);
    close();
    toast("היעד נמחק", {
      duration: 5000,
      action: { label: "ביטול", onClick: () => useAppStore.getState().replaceData(before) },
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      {sheet?.kind === "new" && (
        <GoalForm
          mode={mode}
          workspaceId={workspaceId}
          onSubmit={(input) => {
            addGoal(input);
            close();
          }}
        />
      )}
      {sheet?.kind === "edit" && (
        <GoalForm
          key={sheet.goal.id}
          mode={mode}
          workspaceId={workspaceId}
          goal={sheet.goal}
          onSubmit={(input) => {
            updateGoal(sheet.goal.id, input);
            close();
          }}
          onDelete={() => remove(sheet.goal)}
        />
      )}
      {sheet?.kind === "contribute" && (
        <ContributeForm
          key={sheet.goal.id}
          suggested={progressOf(sheet.goal).monthlyNeeded}
          onSubmit={(amount) => contribute(sheet.goal, amount)}
        />
      )}
    </Sheet>
  );
}
