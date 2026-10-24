"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CycleNav } from "@/components/ui/cycle-nav";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Sheet } from "@/components/ui/sheet";
import { useCycle } from "@/hooks/use-cycle";
import { WORKSPACE_ID } from "@/lib/defaults";
import { budgetStatus } from "@/lib/domain/budgets";
import { inCycle } from "@/lib/domain/period";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { Category, Mode } from "@/lib/types";
import { CategoryForm } from "./category-form";

export function BudgetsView({ mode }: { mode: Mode }) {
  const hydrated = useHasHydrated();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function open(target: Category | "new") {
    setEditing(target);
    setSheetOpen(true);
  }

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">תקציבים וקטגוריות</h1>
        <Button size="sm" onClick={() => open("new")}>
          <Plus aria-hidden className="size-4" />
          קטגוריה
        </Button>
      </header>

      {hydrated && <BudgetsContent mode={mode} onEdit={open} />}

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing === "new" ? "קטגוריה חדשה" : "עריכת קטגוריה"}
      >
        <CategoryForm
          key={editing === "new" ? "new" : editing?.id}
          workspaceId={WORKSPACE_ID[mode]}
          category={editing === "new" || editing === null ? undefined : editing}
          onDone={() => setSheetOpen(false)}
        />
      </Sheet>
    </>
  );
}

function BudgetsContent({ mode, onEdit }: { mode: Mode; onEdit: (category: Category) => void }) {
  const workspaceId = WORKSPACE_ID[mode];
  const categories = useAppStore((s) => s.categories);
  const transactions = useAppStore((s) => s.transactions);
  const [offset, setOffset] = useState(0);
  const cycle = useCycle(mode, offset);

  // Per-category actual totals for the cycle, both directions.
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.workspaceId !== workspaceId || t.status !== "actual" || !inCycle(t.date, cycle)) continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return map;
  }, [transactions, workspaceId, cycle]);

  const own = categories.filter((c) => c.workspaceId === workspaceId);
  const expense = own.filter((c) => c.kind === "expense" && !c.archived);
  const income = own.filter((c) => c.kind === "income" && !c.archived);
  const archived = own.filter((c) => c.archived);

  const budgeted = expense.filter((c) => c.monthlyBudget);
  const totalBudget = budgeted.reduce((sum, c) => sum + (c.monthlyBudget ?? 0), 0);
  const spentInBudgeted = budgeted.reduce((sum, c) => sum + (totals.get(c.id) ?? 0), 0);

  return (
    <>
      <div className="mb-4">
        <CycleNav cycle={cycle} offset={offset} onOffsetChange={setOffset} />
      </div>

      <Card className="mb-6">
        {totalBudget > 0 ? (
          <>
            <p className="text-sm text-fg-muted">נוצל מתוך התקציב</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              <Money value={spentInBudgeted} /> <span className="text-base font-normal text-fg-muted">מתוך</span>{" "}
              <Money value={totalBudget} className="text-base font-normal text-fg-muted" />
            </p>
            <ProgressBar
              className="mt-4"
              value={spentInBudgeted / totalBudget}
              status={budgetStatus(spentInBudgeted, totalBudget)}
            />
          </>
        ) : (
          <p className="text-sm text-fg-muted">עדיין לא הוגדרו תקציבים. לחצו על קטגוריה כדי לקבוע לה תקציב חודשי.</p>
        )}
      </Card>

      <CategorySection title="הוצאות">
        {expense.map((c, i) => {
          const spent = totals.get(c.id) ?? 0;
          const status = budgetStatus(spent, c.monthlyBudget);
          return (
            <CategoryRow key={c.id} category={c} onClick={() => onEdit(c)}>
              <span className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-fg-muted">
                  <Money value={spent} className={status === "over" ? "text-negative" : "text-fg"} />
                  {c.monthlyBudget ? (
                    <>
                      {" / "}
                      <Money value={c.monthlyBudget} />
                    </>
                  ) : null}
                </span>
              </span>
              {c.monthlyBudget ? (
                <ProgressBar className="mt-2" value={spent / c.monthlyBudget} status={status} index={i} />
              ) : (
                <span className="mt-0.5 block text-xs text-fg-muted">ללא תקציב</span>
              )}
            </CategoryRow>
          );
        })}
      </CategorySection>

      <CategorySection title="הכנסות">
        {income.map((c) => (
          <CategoryRow key={c.id} category={c} onClick={() => onEdit(c)}>
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium">{c.name}</span>
              <Money value={totals.get(c.id) ?? 0} className="shrink-0 text-positive" />
            </span>
          </CategoryRow>
        ))}
      </CategorySection>

      {archived.length > 0 && (
        <CategorySection title="בארכיון">
          {archived.map((c) => (
            <CategoryRow key={c.id} category={c} onClick={() => onEdit(c)}>
              <span className="truncate text-sm text-fg-muted">{c.name}</span>
            </CategoryRow>
          ))}
        </CategorySection>
      )}
    </>
  );
}

function CategorySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-xs font-medium text-fg-muted">{title}</h2>
      <ul className="-mx-2">{children}</ul>
    </section>
  );
}

function CategoryRow({
  category,
  onClick,
  children,
}: {
  category: Category;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start transition-colors duration-150 hover:bg-hover"
      >
        <CategoryIcon icon={category.icon} />
        <span className="min-w-0 flex-1">{children}</span>
      </button>
    </li>
  );
}
