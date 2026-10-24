"use client";

import { Inbox } from "lucide-react";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { WORKSPACE_ID } from "@/lib/defaults";
import { toISODate } from "@/lib/format";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { Mode } from "@/lib/types";

const copy: Record<Mode, { title: string; balance: string; income: string; expense: string }> = {
  family: {
    title: "הבית החודש",
    balance: "נשאר החודש",
    income: "הכנסות",
    expense: "הוצאות הבית",
  },
  business: {
    title: "העסק החודש",
    balance: "תזרים החודש",
    income: "הכנסות מלקוחות",
    expense: "הוצאות תפעול",
  },
};

export function Dashboard({ mode }: { mode: Mode }) {
  const hydrated = useHasHydrated();
  const transactions = useAppStore((s) => s.transactions);

  const totals = useMemo(() => {
    // Data only exists client-side; skip work (and `new Date()`) while prerendering.
    if (!hydrated) return { income: 0, expense: 0, balance: 0, count: 0 };
    const monthPrefix = toISODate(new Date()).slice(0, 7);
    let income = 0;
    let expense = 0;
    let count = 0;
    for (const t of transactions) {
      if (t.workspaceId !== WORKSPACE_ID[mode] || t.status !== "actual") continue;
      count++;
      if (!t.date.startsWith(monthPrefix)) continue;
      if (t.kind === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense, count };
  }, [hydrated, transactions, mode]);

  const text = copy[mode];

  return (
    <>
      <PageHeader title={text.title} />

      <Card className="mb-4">
        <p className="text-sm text-fg-muted">{text.balance}</p>
        <p className="mt-1 text-[clamp(2rem,6vw,2.75rem)] leading-tight font-semibold tracking-tight">
          <Money value={totals.balance} />
        </p>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4">
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

      {hydrated && totals.count === 0 && (
        <EmptyState icon={Inbox} title="אין עדיין תנועות">
          הוספת תנועות ונתוני דמו יגיעו בשלבים הבאים.
        </EmptyState>
      )}
    </>
  );
}
