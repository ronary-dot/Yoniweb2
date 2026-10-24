import clsx from "clsx";
import type { CSSProperties } from "react";
import type { BudgetStatus } from "@/lib/domain/budgets";

const fill: Record<BudgetStatus, string> = {
  none: "bg-fg/20",
  ok: "bg-accent",
  warning: "bg-warning",
  over: "bg-negative",
};

interface ProgressBarProps {
  /** 0–1; values above 1 render full. */
  value: number;
  status?: BudgetStatus;
  /** Position in a list, for the staggered grow-in. */
  index?: number;
  className?: string;
}

/** A thin bar that grows in from the start edge once per page visit (SPEC §11). */
export function ProgressBar({ value, status = "ok", index = 0, className }: ProgressBarProps) {
  const ratio = Math.min(Math.max(value, 0), 1);
  return (
    <div className={clsx("h-1.5 overflow-hidden rounded-full bg-hover", className)}>
      <div
        className={clsx("bar-fill h-full origin-right rounded-full", fill[status])}
        style={{ transform: `scaleX(${ratio})`, "--i": index } as CSSProperties}
      />
    </div>
  );
}
