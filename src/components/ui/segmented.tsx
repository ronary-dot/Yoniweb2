"use client";

import clsx from "clsx";

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

/** A radio group drawn as a segmented toggle. */
export function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx("grid auto-cols-fr grid-flow-col rounded-[10px] bg-hover p-0.5", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "h-9 rounded-lg px-3 text-sm whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
            value === o.value ? "bg-surface font-medium text-fg shadow-card" : "text-fg-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
