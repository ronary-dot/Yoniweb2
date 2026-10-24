"use client";

import NumberFlow from "@number-flow/react";
import clsx from "clsx";
import { formatMoney } from "@/lib/format";
import type { Money as MoneyValue } from "@/lib/types";

interface MoneyProps {
  value: MoneyValue;
  precise?: boolean;
  /** Color by sign: positive green, negative red. */
  signed?: boolean;
  className?: string;
  /**
   * Roll digits from the previous value when it changes on screen (SPEC §11).
   * Never animates on first render.
   */
  animated?: boolean;
}

const FLOW_FORMAT = { style: "currency", currency: "ILS", maximumFractionDigits: 0 } as const;
const FLOW_TIMING = { duration: 500, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };

/** The one way to render an amount: tabular digits, isolated from RTL flow. */
export function Money({ value, precise, signed, className, animated }: MoneyProps) {
  return (
    <bdi
      className={clsx(
        "tabular-nums",
        signed && value > 0 && "text-positive",
        signed && value < 0 && "text-negative",
        className,
      )}
    >
      {animated && !precise ? (
        <NumberFlow
          value={Math.round(value / 100)}
          locales="he-IL"
          format={FLOW_FORMAT}
          transformTiming={FLOW_TIMING}
          spinTiming={FLOW_TIMING}
        />
      ) : (
        formatMoney(value, { precise })
      )}
    </bdi>
  );
}
