"use client";

import clsx from "clsx";
import { Check, Plus, ShoppingCart, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Sheet } from "@/components/ui/sheet";
import { fieldClass } from "@/components/ui/styles";
import { WORKSPACE_ID } from "@/lib/defaults";
import { parseAmount, toISODate } from "@/lib/format";
import { snapshotData, useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { ShoppingList } from "@/lib/types";

export function ShoppingView() {
  const hydrated = useHasHydrated();
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">קניות</h1>
      </header>
      {hydrated && <ShoppingContent />}
    </>
  );
}

function ShoppingContent() {
  const lists = useAppStore((s) => s.shoppingLists);
  const addShoppingList = useAppStore((s) => s.addShoppingList);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = lists.find((l) => l.id === selectedId) ?? lists[0];

  function newList() {
    const id = addShoppingList(`רשימה ${lists.length + 1}`);
    setSelectedId(id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={l.id === selected?.id}
              onClick={() => setSelectedId(l.id)}
              className={clsx(
                "pressable h-8 rounded-full px-3 text-sm",
                l.id === selected?.id ? "bg-fg font-medium text-bg" : "bg-hover text-fg-muted hover:text-fg",
              )}
            >
              {l.name}
              <span className="ms-1.5 tabular-nums opacity-60">{l.items.filter((i) => !i.done).length}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={newList}
            className="pressable flex h-8 items-center gap-1 rounded-full px-3 text-sm text-fg-muted hover:bg-hover hover:text-fg"
          >
            <Plus aria-hidden className="size-4" />
            רשימה
          </button>
        </div>
        {selected ? (
          <ListCard key={selected.id} list={selected} onDeleted={() => setSelectedId(null)} />
        ) : (
          <EmptyState icon={ShoppingCart} title="אין רשימות קניות">
            צרו רשימה, סמנו מה נכנס לעגלה, וסגרו קנייה כדי לרשום אותה כהוצאה.
          </EmptyState>
        )}
      </div>
      <GroceryStats />
    </div>
  );
}

function ListCard({ list, onDeleted }: { list: ShoppingList; onDeleted: () => void }) {
  const { addShoppingItem, toggleShoppingItem, removeShoppingItem, renameShoppingList, deleteShoppingList, checkoutShoppingList } =
    useAppStore.getState();
  const reduceMotion = useReducedMotion();
  const [label, setLabel] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Checked items sink to the bottom; stable order within each group.
  const items = [...list.items].sort((a, b) => Number(a.done) - Number(b.done));
  const doneCount = list.items.filter((i) => i.done).length;

  function add(event: FormEvent) {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    addShoppingItem(list.id, trimmed);
    setLabel("");
  }

  function remove() {
    const before = snapshotData();
    deleteShoppingList(list.id);
    onDeleted();
    toast(`הרשימה "${list.name}" נמחקה`, {
      duration: 5000,
      action: { label: "ביטול", onClick: () => useAppStore.getState().replaceData(before) },
    });
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <input
          aria-label="שם הרשימה"
          value={list.name}
          onChange={(e) => renameShoppingList(list.id, e.target.value)}
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-[15px] font-medium outline-none focus:bg-hover"
        />
        <Button variant="ghost" size="sm" onClick={remove}>
          מחיקה
        </Button>
      </div>

      <form onSubmit={add} className="mb-2 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="הוסיפו פריט ולחצו Enter"
          enterKeyHint="enter"
          className={fieldClass}
        />
        <Button type="submit" size="lg" aria-label="הוספת פריט" className="px-3.5">
          <Plus aria-hidden className="size-4" />
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">הרשימה ריקה.</p>
      ) : (
        <ul className="-mx-2">
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout={reduceMotion ? false : "position"}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="group flex items-center gap-1"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={item.done}
                onClick={() => toggleShoppingItem(list.id, item.id)}
                data-done={item.done || undefined}
                className="flex min-h-11 flex-1 items-center gap-3 rounded-xl px-2 text-start"
              >
                <span
                  aria-hidden
                  className={clsx(
                    "grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-150",
                    item.done ? "border-accent bg-accent text-white" : "border-fg/25",
                  )}
                >
                  {item.done && <Check strokeWidth={3} className="size-3.5" />}
                </span>
                <span className={clsx("strike text-sm transition-colors duration-150", item.done && "text-fg-muted")}>{item.label}</span>
                {item.qty && <span className="text-xs text-fg-muted">{item.qty}</span>}
              </button>
              <button
                type="button"
                aria-label={`הסרת ${item.label}`}
                onClick={() => removeShoppingItem(list.id, item.id)}
                className="pressable grid size-8 shrink-0 place-items-center rounded-lg text-fg-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-hover max-md:opacity-100"
              >
                <X aria-hidden className="size-4" />
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Button variant="primary" size="lg" className="mt-4 w-full" disabled={doneCount === 0} onClick={() => setCheckoutOpen(true)}>
        סיום קנייה{doneCount > 0 ? ` (${doneCount} פריטים)` : ""}
      </Button>

      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen} title="סיום קנייה">
        <CheckoutForm
          onSubmit={(amount) => {
            checkoutShoppingList(list.id, amount);
            setCheckoutOpen(false);
            toast("הקנייה נרשמה כהוצאה בסופר ומזון");
          }}
        />
      </Sheet>
    </Card>
  );
}

function CheckoutForm({ onSubmit }: { onSubmit: (amount: number) => void }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseAmount(amount);
        if (parsed === null) return setError("נא להזין את הסכום ששולם");
        onSubmit(parsed);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-fg-muted">כמה שילמתם? הפריטים שסומנו יוסרו מהרשימה.</p>
      <div className="flex items-baseline justify-center gap-1 py-2">
        <span className="text-2xl text-fg-muted">₪</span>
        <input
          autoFocus
          aria-label="סכום"
          dir="ltr"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
          className="w-[7ch] bg-transparent text-center text-[2.5rem] leading-tight font-semibold tabular-nums outline-none placeholder:text-fg/20"
        />
      </div>
      <p role="alert" className="min-h-5 text-center text-sm text-negative">
        {error}
      </p>
      <Button type="submit" variant="primary" size="lg">
        רישום הקנייה
      </Button>
    </form>
  );
}

/** Weekly grocery average over the last eight weeks, and this month vs last. */
function GroceryStats() {
  const transactions = useAppStore((s) => s.transactions);
  const stats = useMemo(() => {
    const today = new Date();
    const since = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 56));
    const thisMonth = toISODate(today).slice(0, 7);
    const lastMonth = toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 1)).slice(0, 7);
    let eightWeeks = 0;
    let current = 0;
    let previous = 0;
    for (const t of transactions) {
      if (t.workspaceId !== WORKSPACE_ID.family || t.categoryId !== "family-groceries" || t.status !== "actual") continue;
      if (t.date > since) eightWeeks += t.amount;
      if (t.date.startsWith(thisMonth)) current += t.amount;
      if (t.date.startsWith(lastMonth)) previous += t.amount;
    }
    return { weekly: Math.round(eightWeeks / 8), current, previous };
  }, [transactions]);

  return (
    <Card className="h-fit">
      <p className="text-sm text-fg-muted">ממוצע קנייה שבועית</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        <Money value={stats.weekly} />
      </p>
      <dl className="mt-4 flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-fg-muted">החודש</dt>
          <dd>
            <Money value={stats.current} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">בחודש שעבר</dt>
          <dd>
            <Money value={stats.previous} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}
