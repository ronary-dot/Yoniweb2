"use client";

import clsx from "clsx";
import { Info, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CashflowChart } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { WORKSPACE_ID } from "@/lib/defaults";
import { cashOnHand, forecast } from "@/lib/domain/cashflow";
import { businessInsights, type Insight } from "@/lib/domain/insights";
import { clientSummaries } from "@/lib/domain/invoices";
import { toISODate } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";

const toneIcon: Record<Insight["tone"], typeof Info> = { warning: TriangleAlert, info: Info, positive: Sparkles };
const toneClass: Record<Insight["tone"], string> = { warning: "text-warning", info: "text-accent", positive: "text-positive" };
const shortDay = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });

/** Business-only dashboard rows: cash, forecast, receivables, upcoming costs (SPEC §6.1). */
export function BusinessHighlights() {
  const transactions = useAppStore((s) => s.transactions);
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const threshold = useAppStore((s) => s.workspaces.find((w) => w.id === WORKSPACE_ID.business)?.safetyThreshold);
  const ws = WORKSPACE_ID.business;
  const todayISO = toISODate(new Date());

  const points = useMemo(() => forecast(transactions, ws, todayISO, { pastDays: 14, days: 90 }), [transactions, ws, todayISO]);
  const cash = cashOnHand(transactions, ws, todayISO);
  const owing = clientSummaries(clients, invoices, todayISO).filter((s) => s.open > 0).slice(0, 5);
  const insights = businessInsights({ todayISO, workspaceId: ws, transactions, clients, invoices, safetyThreshold: threshold }).slice(0, 3);

  const [y, m, d] = todayISO.split("-").map(Number);
  const twoWeeks = toISODate(new Date(y, m - 1, d + 14));
  const upcomingCosts = transactions
    .filter((t) => t.workspaceId === ws && t.kind === "expense" && t.status === "expected" && t.date >= todayISO && t.date <= twoWeeks)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-sm text-fg-muted">מזומן זמין היום</p>
            <p className="text-2xl font-semibold tracking-tight">
              <Money value={cash} />
            </p>
          </div>
          <Link href="/business/cashflow" className="text-sm text-fg-muted transition-colors duration-150 hover:text-accent">
            תחזית מלאה
          </Link>
        </div>
        <CashflowChart points={points} todayISO={todayISO} threshold={threshold} height={160} compact />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
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
            <h2 className="text-[15px] font-medium">לקוחות שחייבים</h2>
            <Link href="/business/clients" className="text-sm text-fg-muted transition-colors duration-150 hover:text-accent">
              הכל
            </Link>
          </div>
          {owing.length === 0 ? (
            <p className="text-sm text-fg-muted">אין יתרות פתוחות.</p>
          ) : (
            <ul className="flex flex-col gap-2.5 text-sm">
              {owing.map((s) => (
                <li key={s.client.id} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">
                    {s.client.name}
                    {s.overdue > 0 && <span className="text-xs text-negative"> · באיחור {s.maxDaysOverdue} ימים</span>}
                  </span>
                  <Money value={s.open} className="shrink-0 font-medium" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-[15px] font-medium">הוצאות ב-14 הימים הקרובים</h2>
          {upcomingCosts.length === 0 ? (
            <p className="text-sm text-fg-muted">אין הוצאות צפויות.</p>
          ) : (
            <ul className="flex flex-col gap-2.5 text-sm">
              {upcomingCosts.slice(0, 6).map((t) => {
                const [ty, tm, td] = t.date.split("-").map(Number);
                return (
                  <li key={t.id} className="flex items-baseline justify-between gap-2">
                    <span className="truncate">
                      <span className="text-xs text-fg-muted tabular-nums">{shortDay.format(new Date(ty, tm - 1, td))} · </span>
                      {t.note}
                    </span>
                    <Money value={t.amount} className="shrink-0 font-medium" />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
