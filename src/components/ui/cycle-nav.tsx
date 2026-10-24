"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Cycle, cycleLabel } from "@/lib/domain/period";

interface CycleNavProps {
  cycle: Cycle;
  offset: number;
  onOffsetChange: (offset: number) => void;
}

/** Previous/next cycle stepper. In RTL, "back in time" points right. */
export function CycleNav({ cycle, offset, onOffsetChange }: CycleNavProps) {
  const button =
    "pressable grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg disabled:opacity-30";
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="המחזור הקודם" className={button} onClick={() => onOffsetChange(offset - 1)}>
        <ChevronRight aria-hidden className="size-4" />
      </button>
      <span className="min-w-32 text-center text-sm font-medium tabular-nums">{cycleLabel(cycle)}</span>
      <button
        type="button"
        aria-label="המחזור הבא"
        className={button}
        disabled={offset >= 0}
        onClick={() => onOffsetChange(offset + 1)}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
    </div>
  );
}
