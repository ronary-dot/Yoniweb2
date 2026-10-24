"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { MODE_ORDER, MODES } from "@/lib/modes";
import type { Mode } from "@/lib/types";

interface ModeSwitchProps {
  mode: Mode;
  onSwitch: (mode: Mode) => void;
  /** Skip the pill slide — used after a keyboard-initiated switch. */
  instant?: boolean;
  compact?: boolean;
}

export function ModeSwitch({ mode, onSwitch, instant, compact }: ModeSwitchProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label="מצב"
      className="relative grid grid-cols-2 rounded-[10px] bg-hover p-0.5"
    >
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
            {active && (
              <motion.span
                layoutId={compact ? "mode-pill-compact" : "mode-pill"}
                aria-hidden
                className="absolute inset-0 rounded-lg bg-surface shadow-card"
                transition={
                  instant || reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", duration: 0.35, bounce: 0 }
                }
              />
            )}
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
