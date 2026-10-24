import clsx from "clsx";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={clsx("min-w-0 rounded-2xl bg-surface p-5 shadow-card", className)}
      {...props}
    />
  );
}
