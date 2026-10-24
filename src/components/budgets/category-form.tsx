"use client";

import clsx from "clsx";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { fieldClass } from "@/components/ui/styles";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { amountToInput, parseAmount } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import type { Category } from "@/lib/types";

interface CategoryFormProps {
  workspaceId: string;
  category?: Category;
  onDone: () => void;
}

export function CategoryForm({ workspaceId, category, onDone }: CategoryFormProps) {
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);

  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<Category["kind"]>(category?.kind ?? "expense");
  const [icon, setIcon] = useState(category?.icon ?? "Tag");
  const [budget, setBudget] = useState(category?.monthlyBudget ? amountToInput(category.monthlyBudget) : "");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("נא להזין שם");
    let monthlyBudget: number | undefined;
    if (kind === "expense" && budget.trim()) {
      const parsed = parseAmount(budget);
      if (parsed === null) return setError("נא להזין תקציב תקין");
      monthlyBudget = parsed;
    }

    if (category) updateCategory(category.id, { name: trimmed, icon, monthlyBudget });
    else addCategory({ workspaceId, name: trimmed, kind, icon, monthlyBudget });
    onDone();
  }

  function toggleArchived() {
    if (!category) return;
    updateCategory(category.id, { archived: !category.archived });
    onDone();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {!category && (
        <Segmented
          label="סוג"
          value={kind}
          onChange={setKind}
          options={[
            { value: "expense", label: "הוצאה" },
            { value: "income", label: "הכנסה" },
          ]}
        />
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-fg-muted">שם</span>
        <input
          autoFocus={!category}
          value={name}
          maxLength={40}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          className={fieldClass}
        />
      </label>

      {kind === "expense" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">תקציב חודשי (לא חובה)</span>
          <input
            dir="ltr"
            inputMode="decimal"
            placeholder="₪"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setError(null);
            }}
            className={clsx(fieldClass, "text-end tabular-nums")}
          />
        </label>
      )}

      <fieldset>
        <legend className="mb-2 text-sm text-fg-muted">אייקון</legend>
        <div role="radiogroup" aria-label="אייקון" className="grid grid-cols-8 gap-1">
          {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={icon === key}
              aria-label={key}
              onClick={() => setIcon(key)}
              className={clsx(
                "pressable grid aspect-square place-items-center rounded-lg",
                icon === key ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-hover",
              )}
            >
              <Icon aria-hidden strokeWidth={1.75} className="size-[18px]" />
            </button>
          ))}
        </div>
      </fieldset>

      <p role="alert" className="min-h-5 text-sm text-negative">
        {error}
      </p>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="lg" className="flex-1">
          {category ? "שמירה" : "הוספה"}
        </Button>
        {category && (
          <Button variant="ghost" size="lg" onClick={toggleArchived}>
            {category.archived ? "שחזור" : "העברה לארכיון"}
          </Button>
        )}
      </div>
    </form>
  );
}
