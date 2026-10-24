import clsx from "clsx";
import { formatMoney } from "@/lib/format";
import type { Money as MoneyValue } from "@/lib/types";

interface MoneyProps {
  value: MoneyValue;
  precise?: boolean;
  /** Color by sign: positive green, negative red. */
  signed?: boolean;
  className?: string;
}

/** The one way to render an amount: tabular digits, isolated from RTL flow. */
export function Money({ value, precise, signed, className }: MoneyProps) {
  return (
    <bdi
      className={clsx(
        "tabular-nums",
        signed && value > 0 && "text-positive",
        signed && value < 0 && "text-negative",
        className,
      )}
    >
      {formatMoney(value, { precise })}
    </bdi>
  );
}
