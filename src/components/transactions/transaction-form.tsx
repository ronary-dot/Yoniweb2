"use client";

import clsx from "clsx";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryGlyph } from "@/components/ui/category-icon";
import { Segmented } from "@/components/ui/segmented";
import { fieldClass } from "@/components/ui/styles";
import { WORKSPACE_ID } from "@/lib/defaults";
import { recentCategoryIds } from "@/lib/domain/budgets";
import { amountToInput, parseAmount, toISODate } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import type { Mode, PaymentMethod, Transaction } from "@/lib/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "אשראי" },
  { value: "cash", label: "מזומן" },
  { value: "transfer", label: "העברה" },
  { value: "app", label: "ביט / פייבוקס" },
  { value: "standing_order", label: "הוראת קבע" },
];

interface TransactionFormProps {
  mode: Mode;
  transaction?: Transaction;
  onSaved: () => void;
  onDelete?: (id: string) => void;
}

export function TransactionForm({ mode, transaction, onSaved, onDelete }: TransactionFormProps) {
  const workspaceId = WORKSPACE_ID[mode];
  const categories = useAppStore((s) => s.categories);
  const transactions = useAppStore((s) => s.transactions);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);

  const [kind, setKind] = useState<Transaction["kind"]>(transaction?.kind ?? "expense");
  const [amount, setAmount] = useState(transaction ? amountToInput(transaction.amount) : "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [date, setDate] = useState(transaction?.date ?? toISODate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(transaction?.paymentMethod ?? "");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  // Recently used first, then the default order (SPEC §7).
  const options = useMemo(() => {
    const recent = recentCategoryIds(transactions, workspaceId);
    const rank = (id: string) => {
      const i = recent.indexOf(id);
      return i === -1 ? Infinity : i;
    };
    return categories
      .filter((c) => c.workspaceId === workspaceId && c.kind === kind && (!c.archived || c.id === categoryId))
      .map((c, order) => ({ c, order }))
      .sort((a, b) => rank(a.c.id) - rank(b.c.id) || a.order - b.order)
      .map(({ c }) => c);
  }, [categories, transactions, workspaceId, kind, categoryId]);

  function onKindChange(next: Transaction["kind"]) {
    setKind(next);
    setCategoryId("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const agorot = parseAmount(amount);
    if (agorot === null) return setError("נא להזין סכום תקין");
    if (!categoryId) return setError("נא לבחור קטגוריה");

    const input = {
      workspaceId,
      kind,
      amount: agorot,
      categoryId,
      date,
      status: "actual" as const,
      paymentMethod: paymentMethod || undefined,
      note: note.trim() || undefined,
    };
    if (transaction) updateTransaction(transaction.id, input);
    else addTransaction(input);
    onSaved();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Segmented
        label="סוג"
        value={kind}
        onChange={onKindChange}
        options={[
          { value: "expense", label: "הוצאה" },
          { value: "income", label: "הכנסה" },
        ]}
      />

      <label className="block">
        <span className="sr-only">סכום</span>
        <div className="flex items-baseline justify-center gap-1 py-2">
          <span className="text-2xl text-fg-muted">₪</span>
          <input
            autoFocus
            dir="ltr"
            inputMode="decimal"
            enterKeyHint="done"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            className="w-[7ch] bg-transparent text-center text-[2.5rem] leading-tight font-semibold tabular-nums outline-none placeholder:text-fg/20"
          />
        </div>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-fg-muted">קטגוריה</legend>
        <div role="radiogroup" aria-label="קטגוריה" className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {options.map((c) => {
            const selected = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setCategoryId(c.id);
                  setError(null);
                }}
                className={clsx(
                  "pressable flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] leading-tight",
                  selected ? "bg-accent-soft font-medium text-fg" : "text-fg-muted hover:bg-hover",
                )}
              >
                <CategoryGlyph icon={c.icon} className={clsx("size-5", selected && "text-accent")} />
                <span className="line-clamp-2">{c.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">תאריך</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">אמצעי תשלום</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
            className={fieldClass}
          >
            <option value="">—</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-fg-muted">הערה</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="לא חובה"
          maxLength={120}
          className={fieldClass}
        />
      </label>

      <p role="alert" className="min-h-5 text-sm text-negative">
        {error}
      </p>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="lg" className="flex-1">
          {transaction ? "שמירה" : "הוספה"}
        </Button>
        {transaction && onDelete && (
          <Button variant="danger" size="lg" onClick={() => onDelete(transaction.id)}>
            מחיקה
          </Button>
        )}
      </div>
    </form>
  );
}
