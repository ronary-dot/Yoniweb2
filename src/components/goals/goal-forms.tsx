"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { fieldClass } from "@/components/ui/styles";
import { amountToInput, parseAmount } from "@/lib/format";
import type { GoalInput } from "@/lib/store/app-store";
import type { Goal, Mode, Money as MoneyValue } from "@/lib/types";

const BUSINESS_TYPES = [
  { value: "revenue", label: "יעד הכנסות" },
  { value: "reserve", label: "רזרבה" },
] as const;

interface GoalFormProps {
  mode: Mode;
  workspaceId: string;
  goal?: Goal;
  onSubmit: (input: GoalInput) => void;
  onDelete?: () => void;
}

export function GoalForm({ mode, workspaceId, goal, onSubmit, onDelete }: GoalFormProps) {
  const [name, setName] = useState(goal?.name ?? "");
  const [emoji, setEmoji] = useState(goal?.emoji ?? "");
  const [target, setTarget] = useState(goal ? amountToInput(goal.target) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [type, setType] = useState<Goal["type"]>(goal?.type ?? (mode === "family" ? "saving" : "reserve"));
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("נא להזין שם ליעד");
    const amount = parseAmount(target);
    if (amount === null) return setError("נא להזין סכום יעד תקין");
    onSubmit({
      workspaceId,
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      target: amount,
      deadline: deadline || undefined,
      type,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {mode === "business" && (
        <Segmented
          label="סוג יעד"
          value={type as "revenue" | "reserve"}
          onChange={setType}
          options={BUSINESS_TYPES}
        />
      )}
      <div className="grid grid-cols-[4.5rem_1fr] gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">אמוג׳י</span>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} placeholder="🎯" className={`${fieldClass} text-center`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">שם</span>
          <input
            autoFocus={!goal}
            value={name}
            maxLength={40}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">{type === "revenue" ? "הכנסות בחודש" : "סכום יעד"}</span>
          <input
            dir="ltr"
            inputMode="decimal"
            placeholder="₪"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setError(null);
            }}
            className={`${fieldClass} text-end tabular-nums`}
          />
        </label>
        {type !== "revenue" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-fg-muted">תאריך יעד (לא חובה)</span>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldClass} />
          </label>
        )}
      </div>
      <p role="alert" className="min-h-5 text-sm text-negative">
        {error}
      </p>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="lg" className="flex-1">
          {goal ? "שמירה" : "יצירת יעד"}
        </Button>
        {onDelete && (
          <Button variant="danger" size="lg" onClick={onDelete}>
            מחיקה
          </Button>
        )}
      </div>
    </form>
  );
}

interface ContributeFormProps {
  suggested: MoneyValue | null;
  onSubmit: (amount: MoneyValue) => void;
}

export function ContributeForm({ suggested, onSubmit }: ContributeFormProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const quick = [...new Set([10_000, 25_000, 50_000, ...(suggested ? [suggested] : [])])].sort((a, b) => a - b);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (parsed === null) return setError("נא להזין סכום תקין");
    onSubmit(parsed);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <label className="block">
        <span className="sr-only">סכום</span>
        <div className="flex items-baseline justify-center gap-1 py-2">
          <span className="text-2xl text-fg-muted">₪</span>
          <input
            autoFocus
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
      </label>
      <div className="flex flex-wrap justify-center gap-2">
        {quick.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(amountToInput(value))}
            className="pressable h-8 rounded-full bg-hover px-3 text-sm hover:bg-accent-soft"
          >
            <Money value={value} />
            {value === suggested && <span className="ms-1 text-fg-muted">· מומלץ</span>}
          </button>
        ))}
      </div>
      <p role="alert" className="min-h-5 text-center text-sm text-negative">
        {error}
      </p>
      <Button type="submit" variant="primary" size="lg">
        הפקדה
      </Button>
    </form>
  );
}
