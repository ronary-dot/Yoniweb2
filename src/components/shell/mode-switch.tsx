"use client";

import clsx from "clsx";
import { MODE_ORDER, MODES } from "@/lib/modes";
import type { Mode } from "@/lib/types";

interface ModeSwitchProps {
  mode: Mode;
  onSwitch: (mode: Mode) => void;
  /** Skip the pill slide — used after a keyboard-initiated switch. */
  instant?: boolean;
  compact?: boolean;
}

/**
 * The pill slides with a CSS transform transition rather than a JS spring:
 * just as interruptible, runs off the main thread while the next page loads,
 * and keeps an animation library out of the shell's first load.
 */
export function ModeSwitch({ mode, onSwitch, instant, compact }: ModeSwitchProps) {
  const index = MODE_ORDER.indexOf(mode);

  return (
    <div role="radiogroup" aria-label="מצב" className="relative grid grid-cols-2 rounded-[10px] bg-hover p-0.5">
      <span
        aria-hidden
        data-instant={instant || undefined}
        className="mode-pill absolute inset-y-0.5 start-0.5 w-[calc(50%-2px)] rounded-lg bg-surface shadow-card"
        // RTL: the first option sits on the right, so later options move left.
        style={{ transform: `translateX(${index * -100}%)` }}
      />
      {MODE_ORDER.map((m) => {
        const { label, icon: Icon } = MODES[m];
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => !active && onSwitch(m)}
            className={clsx(
              "pressable relative flex items-center justify-center gap-1.5 rounded-lg font-medium",
              compact ? "h-8 px-3 text-[13px]" : "h-9 px-3 text-sm",
              active ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            <Icon
              aria-hidden
              strokeWidth={1.75}
              className={clsx("relative size-4 transition-colors duration-200", active && "text-accent")}
            />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
