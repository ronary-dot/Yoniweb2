"use client";

import { CategoryIcon } from "@/components/ui/category-icon";
import { Money } from "@/components/ui/money";
import { toISODate } from "@/lib/format";
import { useTransactionSheet } from "@/lib/store/ui-store";
import type { Category, Transaction } from "@/lib/types";

const PAYMENT_LABEL: Record<NonNullable<Transaction["paymentMethod"]>, string> = {
  card: "אשראי",
  cash: "מזומן",
  transfer: "העברה",
  app: "אפליקציה",
  standing_order: "הוראת קבע",
};

const dayFormat = new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long" });

function dayLabel(iso: string, todayISO: string, yesterdayISO: string): string {
  if (iso === todayISO) return "היום";
  if (iso === yesterdayISO) return "אתמול";
  const [y, m, d] = iso.split("-").map(Number);
  return dayFormat.format(new Date(y, m - 1, d));
}

export function TransactionRow({ transaction, category }: { transaction: Transaction; category?: Category }) {
  const openEdit = useTransactionSheet((s) => s.openEdit);
  const signed = transaction.kind === "income" ? transaction.amount : -transaction.amount;
  const meta = [transaction.note, transaction.paymentMethod && PAYMENT_LABEL[transaction.paymentMethod]]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <button
        type="button"
        onClick={() => openEdit(transaction.id)}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start transition-colors duration-150 hover:bg-hover"
      >
        <CategoryIcon icon={category?.icon ?? "Tag"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{category?.name ?? "ללא קטגוריה"}</span>
          {meta && <span className="block truncate text-xs text-fg-muted">{meta}</span>}
        </span>
        <Money
          value={signed}
          precise={transaction.amount % 100 !== 0}
          className={transaction.kind === "income" ? "text-sm font-medium text-positive" : "text-sm font-medium"}
        />
      </button>
    </li>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  /** Group under day headers with a daily net total. */
  grouped?: boolean;
}

/** Newest first. */
export function TransactionList({ transactions, categories, grouped = false }: TransactionListProps) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  if (!grouped) {
    return (
      <ul className="-mx-2">
        {sorted.map((t) => (
          <TransactionRow key={t.id} transaction={t} category={byId.get(t.categoryId)} />
        ))}
      </ul>
    );
  }

  const days = new Map<string, Transaction[]>();
  for (const t of sorted) days.set(t.date, [...(days.get(t.date) ?? []), t]);

  const now = new Date();
  const todayISO = toISODate(now);
  const yesterdayISO = toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  return (
    <div className="flex flex-col gap-6">
      {[...days].map(([day, items]) => {
        const net = items.reduce((sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount), 0);
        return (
          <section key={day}>
            <h2 className="mb-1 flex items-baseline justify-between text-xs font-medium text-fg-muted">
              <span>{dayLabel(day, todayISO, yesterdayISO)}</span>
              <Money value={net} />
            </h2>
            <ul className="-mx-2">
              {items.map((t) => (
                <TransactionRow key={t.id} transaction={t} category={byId.get(t.categoryId)} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
