"use client";

import { ChartColumn } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { IncomeExpenseChart, NetChart } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { CycleNav } from "@/components/ui/cycle-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { useCycle } from "@/hooks/use-cycle";
import { WORKSPACE_ID } from "@/lib/defaults";
import { categoryBreakdown, monthlySeries } from "@/lib/domain/reports";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { Mode } from "@/lib/types";

const monthShort = new Intl.DateTimeFormat("he-IL", { month: "short" });
const monthLong = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface MonthRow {
  label: string;
  fullLabel: string;
  income: number;
  expense: number;
  net: number;
}

export function ReportsView({ mode }: { mode: Mode }) {
  const hydrated = useHasHydrated();
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">דוחות</h1>
      </header>
      {hydrated && <ReportsContent mode={mode} />}
    </>
  );
}

function ReportsContent({ mode }: { mode: Mode }) {
  const ws = WORKSPACE_ID[mode];
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const startDay = useAppStore((s) => s.workspaces.find((w) => w.id === ws)?.cycleStartDay ?? 1);
  const [offset, setOffset] = useState(0);
  const cycle = useCycle(mode, offset);

  const months = useMemo((): MonthRow[] => {
    const series = monthlySeries(transactions, ws, new Date(), startDay, 12);
    // Drop leading months with no activity, keeping at least three.
    const first = series.findIndex((p) => p.income || p.expense);
    const trimmed = first === -1 ? [] : series.slice(Math.min(first, series.length - 3));
    return trimmed.map((p) => ({
      label: monthShort.format(parseISO(p.cycle.start)),
      fullLabel: monthLong.format(parseISO(p.cycle.start)),
      income: p.income,
      expense: p.expense,
      net: p.net,
    }));
  }, [transactions, ws, startDay]);

  const breakdown = useMemo(
    () => categoryBreakdown(transactions, categories, ws, cycle),
    [transactions, categories, ws, cycle],
  );

  if (months.length === 0) {
    return (
      <EmptyState icon={ChartColumn} title="אין עדיין נתונים לדוחות">
        הוסיפו תנועות, או טענו נתוני דמו מההגדרות.
      </EmptyState>
    );
  }

  const avgNet = Math.round(months.reduce((s, m) => s + m.net, 0) / months.length);
  const netTitle = mode === "family" ? "חיסכון חודשי" : "רווח תפעולי חודשי";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-medium">הכנסות מול הוצאות</h2>
          <div className="flex gap-4 text-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-(--series-1)" /> הכנסות
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-(--series-2)" /> הוצאות
            </span>
          </div>
        </div>
        <IncomeExpenseChart data={months} />
        <MonthTable months={months} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-medium">{netTitle}</h2>
            <p className="text-xs text-fg-muted">
              ממוצע <Money value={avgNet} className="font-medium text-fg" />
            </p>
          </div>
          <NetChart data={months} />
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-medium">לאן הלך הכסף</h2>
            <CycleNav cycle={cycle} offset={offset} onOffsetChange={setOffset} />
          </div>
          {breakdown.length === 0 ? (
            <p className="text-sm text-fg-muted">אין הוצאות במחזור הזה.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {breakdown.map((row, i) => (
                <li key={row.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{row.name}</span>
                    <span className="shrink-0">
                      <Money value={row.amount} className="font-medium" />
                      <span className="ms-2 inline-block w-9 text-end text-xs text-fg-muted tabular-nums">
                        {Math.round(row.share * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-hover">
                    <div
                      className="bar-fill h-full origin-right rounded-full bg-(--series-1)"
                      style={{ transform: `scaleX(${row.share / breakdown[0].share})`, "--i": i } as CSSProperties}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/** The same numbers as a table, for screen readers and anyone who prefers rows. */
function MonthTable({ months }: { months: MonthRow[] }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-xs text-fg-muted hover:text-fg">הצגה כטבלה</summary>
      <table className="mt-3 w-full">
        <thead className="text-xs text-fg-muted">
          <tr>
            <th className="py-1 text-start font-normal">חודש</th>
            <th className="py-1 text-end font-normal">הכנסות</th>
            <th className="py-1 text-end font-normal">הוצאות</th>
            <th className="py-1 text-end font-normal">נטו</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.fullLabel} className="border-t border-border">
              <td className="py-1.5">{m.fullLabel}</td>
              <td className="py-1.5 text-end">
                <Money value={m.income} />
              </td>
              <td className="py-1.5 text-end">
                <Money value={m.expense} />
              </td>
              <td className="py-1.5 text-end">
                <Money value={m.net} className={m.net < 0 ? "text-negative" : undefined} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
