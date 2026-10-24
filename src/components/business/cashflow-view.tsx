"use client";

import clsx from "clsx";
import { TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { CashflowChart } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { WORKSPACE_ID } from "@/lib/defaults";
import { cashOnHand, forecast, lowestPoint } from "@/lib/domain/cashflow";
import { toISODate } from "@/lib/format";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";

const HORIZONS = [
  { value: "30", label: "30 יום" },
  { value: "60", label: "60 יום" },
  { value: "90", label: "90 יום" },
] as const;

const dayMonth = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" });
const shortDay = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function CashflowView() {
  const hydrated = useHasHydrated();
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">תזרים מזומנים</h1>
      </header>
      {hydrated && <CashflowContent />}
    </>
  );
}

function CashflowContent() {
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const threshold = useAppStore((s) => s.workspaces.find((w) => w.id === WORKSPACE_ID.business)?.safetyThreshold);
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]["value"]>("90");
  const [postponed, setPostponed] = useState<ReadonlySet<string>>(new Set());

  const todayISO = toISODate(new Date());
  const days = Number(horizon);
  const ws = WORKSPACE_ID.business;

  const { cash, points, low, baselineLow } = useMemo(() => {
    const points = forecast(transactions, ws, todayISO, { pastDays: 30, days, postponed });
    return {
      cash: cashOnHand(transactions, ws, todayISO),
      points,
      low: lowestPoint(points),
      baselineLow: postponed.size ? lowestPoint(forecast(transactions, ws, todayISO, { pastDays: 0, days })) : null,
    };
  }, [transactions, ws, todayISO, days, postponed]);

  const horizonEnd = points.at(-1)?.date ?? todayISO;
  const upcoming = useMemo(
    () =>
      transactions
        .filter((t) => t.workspaceId === ws && t.status === "expected" && t.date >= todayISO && t.date <= horizonEnd)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, ws, todayISO, horizonEnd],
  );
  const overdueIncome = transactions.filter(
    (t) => t.workspaceId === ws && t.status === "expected" && t.kind === "income" && t.date < todayISO,
  );
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const belowThreshold = threshold !== undefined && low && low.balance < threshold;
  const nearThreshold = threshold !== undefined && low && !belowThreshold && low.balance < threshold * 1.25;

  function togglePostpone(id: string) {
    setPostponed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-fg-muted">מזומן זמין היום</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            <Money animated value={cash} />
          </p>
        </Card>
        <Card>
          <p className="text-sm text-fg-muted">צפוי בעוד {days} יום</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            <Money animated value={points.at(-1)?.projected ?? cash} />
          </p>
        </Card>
        <Card>
          <p className="text-sm text-fg-muted">הנקודה הנמוכה</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {low && <Money animated value={low.balance} className={clsx(belowThreshold && "text-negative")} />}
          </p>
          {low && <p className="text-xs text-fg-muted">{dayMonth.format(parseISO(low.date))}</p>}
        </Card>
      </div>

      {(belowThreshold || nearThreshold) && low && threshold !== undefined && (
        <div
          role="status"
          className={clsx(
            "mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
            belowThreshold ? "bg-negative/10" : "bg-warning/12",
          )}
        >
          <TriangleAlert aria-hidden className={clsx("mt-0.5 size-4 shrink-0", belowThreshold ? "text-negative" : "text-warning")} />
          <p>
            {belowThreshold ? "התחזית יורדת מתחת" : "התחזית מתקרבת"} לסף הבטיחות (<Money value={threshold} />) ב-
            {dayMonth.format(parseISO(low.date))}.
          </p>
        </div>
      )}

      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-medium">יתרה צפויה</h2>
          <Segmented label="טווח" value={horizon} onChange={setHorizon} options={HORIZONS} />
        </div>
        <CashflowChart points={points} todayISO={todayISO} threshold={threshold} />
        <p className="sr-only">
          {low && `היתרה הנמוכה בתחזית: ${(low.balance / 100).toLocaleString("he-IL")} שקלים ב-${dayMonth.format(parseISO(low.date))}.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-fg-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-4 rounded bg-accent" /> בפועל
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-accent" /> צפוי
          </span>
          {threshold !== undefined && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-negative/60" /> סף בטיחות
            </span>
          )}
        </div>
      </Card>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-medium text-fg-muted">צפוי ב-{days} הימים הקרובים</h2>
          {postponed.size > 0 && baselineLow && low && (
            <p className="text-xs">
              <span className="text-fg-muted">מה אם: הנקודה הנמוכה </span>
              <Money value={baselineLow.balance} className="text-fg-muted line-through" />{" "}
              <Money value={low.balance} className="font-medium" />
            </p>
          )}
        </div>
        <ul className="-mx-2">
          {upcoming.map((t) => {
            const isPostponed = postponed.has(t.id);
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <span className="w-14 shrink-0 text-xs text-fg-muted tabular-nums">{shortDay.format(parseISO(t.date))}</span>
                <span className="min-w-0 flex-1">
                  <span className="block min-w-0 truncate text-sm">{t.note ?? categoryName.get(t.categoryId)}</span>
                  {isPostponed && <span className="block text-xs text-warning">נדחה ב-30 יום</span>}
                </span>
                <Money
                  value={t.kind === "income" ? t.amount : -t.amount}
                  className={clsx("shrink-0 text-sm font-medium", t.kind === "income" && "text-positive", isPostponed && "opacity-50")}
                />
                <button
                  type="button"
                  aria-pressed={isPostponed}
                  onClick={() => togglePostpone(t.id)}
                  className={clsx(
                    "pressable h-7 shrink-0 rounded-full px-2.5 text-xs",
                    isPostponed ? "bg-warning/15 text-warning" : "bg-hover text-fg-muted hover:text-fg",
                  )}
                >
                  {isPostponed ? "ביטול" : "מה אם נדחה?"}
                </button>
              </li>
            );
          })}
        </ul>
        {overdueIncome.length > 0 && (
          <p className="mt-4 text-xs text-fg-muted">
            {overdueIncome.length === 1 ? "תשלום אחד באיחור" : `${overdueIncome.length} תשלומים באיחור`} (
            <Money value={overdueIncome.reduce((sum, t) => sum + t.amount, 0)} />) לא נכללים בתחזית עד שיתקבלו.
          </p>
        )}
      </section>
    </>
  );
}
