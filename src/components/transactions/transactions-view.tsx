"use client";

import clsx from "clsx";
import { Inbox, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CycleNav } from "@/components/ui/cycle-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { useCycle } from "@/hooks/use-cycle";
import { WORKSPACE_ID } from "@/lib/defaults";
import { inCycle } from "@/lib/domain/period";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";
import { useTransactionSheet } from "@/lib/store/ui-store";
import type { Mode, Transaction } from "@/lib/types";
import { TransactionList } from "./transaction-list";

type KindFilter = "all" | Transaction["kind"];

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "expense", label: "הוצאות" },
  { value: "income", label: "הכנסות" },
];

export function TransactionsView({ mode }: { mode: Mode }) {
  const hydrated = useHasHydrated();
  const openNew = useTransactionSheet((s) => s.openNew);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">תנועות</h1>
        <Button variant="primary" size="sm" className="max-md:hidden" onClick={() => openNew()}>
          <Plus aria-hidden className="size-4" />
          תנועה חדשה
        </Button>
      </header>
      {hydrated && <TransactionsContent mode={mode} />}
    </>
  );
}

function TransactionsContent({ mode }: { mode: Mode }) {
  const workspaceId = WORKSPACE_ID[mode];
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const openNew = useTransactionSheet((s) => s.openNew);

  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const cycle = useCycle(mode, offset);

  const workspaceCategories = useMemo(
    () => categories.filter((c) => c.workspaceId === workspaceId),
    [categories, workspaceId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const names = new Map(workspaceCategories.map((c) => [c.id, c.name.toLowerCase()]));
    return transactions.filter(
      (t) =>
        t.workspaceId === workspaceId &&
        t.status === "actual" &&
        inCycle(t.date, cycle) &&
        (kind === "all" || t.kind === kind) &&
        (!categoryId || t.categoryId === categoryId) &&
        (!q || t.note?.toLowerCase().includes(q) || names.get(t.categoryId)?.includes(q)),
    );
  }, [transactions, workspaceCategories, workspaceId, cycle, kind, categoryId, query]);

  const totals = filtered.reduce(
    (acc, t) => {
      acc[t.kind] += t.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

  const hasAny = transactions.some((t) => t.workspaceId === workspaceId);
  const isFiltering = Boolean(query || categoryId || kind !== "all");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <CycleNav cycle={cycle} offset={offset} onOffsetChange={setOffset} />
        <p className="flex gap-4 text-sm text-fg-muted">
          <span>
            הכנסות <Money value={totals.income} className="font-medium text-positive" />
          </span>
          <span>
            הוצאות <Money value={totals.expense} className="font-medium text-fg" />
          </span>
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">חיפוש</span>
          <Search aria-hidden className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי הערה או קטגוריה"
            className="h-10 w-full rounded-[10px] bg-surface ps-9 pe-3 shadow-card outline-none placeholder:text-fg-muted focus:shadow-[0_0_0_2px_var(--accent)]"
          />
        </label>
        <div role="radiogroup" aria-label="סוג" className="flex rounded-[10px] bg-hover p-0.5">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={kind === f.value}
              onClick={() => setKind(f.value)}
              className={clsx(
                "h-9 rounded-lg px-3 text-sm",
                kind === f.value ? "bg-surface font-medium text-fg shadow-card" : "text-fg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">קטגוריה</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 max-w-48 rounded-[10px] bg-surface px-3 text-sm shadow-card outline-none"
          >
            <option value="">כל הקטגוריות</option>
            {workspaceCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length > 0 ? (
        <TransactionList transactions={filtered} categories={workspaceCategories} grouped />
      ) : !hasAny ? (
        <EmptyState icon={Inbox} title="אין עדיין תנועות">
          <p>הוסיפו את ההוצאה או ההכנסה הראשונה.</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => openNew()}>
            <Plus aria-hidden className="size-4" />
            תנועה חדשה
          </Button>
        </EmptyState>
      ) : (
        <EmptyState icon={Search} title={isFiltering ? "אין תנועות שמתאימות לסינון" : "אין תנועות במחזור הזה"} />
      )}
    </>
  );
}
