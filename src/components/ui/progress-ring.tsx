import clsx from "clsx";
import type { ReactNode } from "react";

interface ProgressRingProps {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  achieved?: boolean;
  className?: string;
  children?: ReactNode;
}

/** A ring that draws in on mount and closes smoothly when the value grows. */
export function ProgressRing({ value, size = 64, stroke = 5, achieved, className, children }: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(Math.max(value, 0), 1);
  return (
    <div className={clsx("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-hover" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={clsx("ring-fill", achieved ? "stroke-positive" : "stroke-accent")}
          style={{ "--circumference": circumference } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
