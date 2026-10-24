"use client";

import { Inbox, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { TransactionList } from "@/components/transactions/transaction-list";
import { BusinessHighlights } from "./business-highlights";
import { FamilyHighlights } from "./family-highlights";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useCycle } from "@/hooks/use-cycle";
import { WORKSPACE_ID } from "@/lib/defaults";
import { budgetStatus, spendingByCategory, totalsFor } from "@/lib/domain/budgets";
import { cycleLabel, daysLeft } from "@/lib/domain/period";
import { hrefFor } from "@/lib/modes";
import { loadDemoData } from "@/lib/demo/actions";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";
import { useTransactionSheet } from "@/lib/store/ui-store";
import type { Mode } from "@/lib/types";

const copy: Record<Mode, { title: string; balance: string; income: string; expense: string }> = {
  family: {
    title: "הבית",
    balance: "נשאר החודש",
    income: "הכנסות",
    expense: "הוצאות הבית",
  },
  business: {
    title: "העסק",
    balance: "תזרים נטו",
    income: "הכנסות מלקוחות",
    expense: "הוצאות תפעול",
  },
};

export function Dashboard({ mode }: { mode: Mode }) {
  const hydrated = useHasHydrated();
  return (
    <>
      <PageHeader title={copy[mode].title} />
      {hydrated && <DashboardContent mode={mode} />}
    </>
  );
}

function DashboardContent({ mode }: { mode: Mode }) {
  const workspaceId = WORKSPACE_ID[mode];
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const openNew = useTransactionSheet((s) => s.openNew);
  const cycle = useCycle(mode);
  const text = copy[mode];

  const { totals, top, totalBudget, recent, hasAny } = useMemo(() => {
    const own = transactions.filter((t) => t.workspaceId === workspaceId && t.status === "actual");
    const spent = spendingByCategory(own, workspaceId, cycle);
    const byId = new Map(categories.map((c) => [c.id, c]));
    return {
      totals: totalsFor(own, workspaceId, cycle),
      top: [...spent]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, amount]) => ({ category: byId.get(id), amount })),
      totalBudget: categories
        .filter((c) => c.workspaceId === workspaceId && c.kind === "expense" && !c.archived)
        .reduce((sum, c) => sum + (c.monthlyBudget ?? 0), 0),
      recent: [...own]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
      hasAny: own.length > 0,
    };
  }, [transactions, categories, workspaceId, cycle]);

  const left = daysLeft(new Date(), cycle);
  // A daily allowance is a household idea; a business reads cash flow instead.
  const perDay = mode === "family" && left > 0 && totals.balance > 0 ? Math.floor(totals.balance / left / 100) * 100 : null;
  const maxTop = top[0]?.amount ?? 0;

  if (!hasAny) {
    return (
      <EmptyState icon={Inbox} title="אין עדיין תנועות">
        <p>הוסיפו הוצאה או הכנסה, וכאן תופיע תמונת המצב של המחזור.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="primary" size="sm" onClick={() => openNew()}>
            <Plus aria-hidden className="size-4" />
            תנועה חדשה
          </Button>
          <Button size="sm" onClick={loadDemoData}>
            <Sparkles aria-hidden className="size-4" />
            טען נתוני דמו
          </Button>
        </div>
      </EmptyState>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm text-fg-muted">{text.balance}</p>
          <p className="text-xs text-fg-muted">{cycleLabel(cycle)}</p>
        </div>
        <p className="mt-1 text-[clamp(2rem,6vw,2.75rem)] leading-tight font-semibold tracking-tight">
          <Money value={totals.balance} className={totals.balance < 0 ? "text-negative" : undefined} />
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          {left > 0 ? `עוד ${left} ימים במחזור` : "המחזור הסתיים"}
          {perDay !== null && (
            <>
              {" · כ-"}
              <Money value={perDay} /> ליום
            </>
          )}
        </p>
        {totalBudget > 0 && (
          <div className="mt-4">
            <ProgressBar value={totals.expense / totalBudget} status={budgetStatus(totals.expense, totalBudget)} />
            <p className="mt-1.5 text-xs text-fg-muted">
              <Money value={totals.expense} /> מתוך תקציב של <Money value={totalBudget} />
            </p>
          </div>
        )}
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-fg-muted">{text.income}</p>
          <p className="mt-1 text-xl font-semibold">
            <Money value={totals.income} />
          </p>
        </Card>
        <Card>
          <p className="text-sm text-fg-muted">{text.expense}</p>
          <p className="mt-1 text-xl font-semibold">
            <Money value={totals.expense} />
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="לאן הלך הכסף" href={hrefFor(mode, "budgets")} />
          {top.length === 0 ? (
            <p className="text-sm text-fg-muted">אין הוצאות במחזור הזה.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {top.map(({ category, amount }, i) => {
                const budget = category?.monthlyBudget;
                return (
                  <li key={category?.id ?? i}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate">{category?.name ?? "ללא קטגוריה"}</span>
                      <Money value={amount} className="shrink-0 font-medium" />
                    </div>
                    <ProgressBar
                      index={i}
                      value={budget ? amount / budget : amount / maxTop}
                      status={budget ? budgetStatus(amount, budget) : "none"}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="תנועות אחרונות" href={hrefFor(mode, "transactions")} />
          <TransactionList transactions={recent} categories={categories} />
        </Card>
      </div>

      {mode === "family" ? <FamilyHighlights /> : <BusinessHighlights />}
    </>
  );
}

function CardHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-[15px] font-medium">{title}</h2>
      <Link href={href} className="text-sm text-fg-muted transition-colors duration-150 hover:text-accent">
        הכל
      </Link>
    </div>
  );
}
