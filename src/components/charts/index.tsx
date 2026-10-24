"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ChartImpl from "./cashflow-chart";

/** Recharts is only downloaded on screens that show a chart (SPEC §13.5). */
const LazyCashflowChart = dynamic(() => import("./cashflow-chart"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-xl bg-hover" />,
});

/** Reserves the chart's height up front so nothing shifts when it loads. */
export function CashflowChart(props: ComponentProps<typeof ChartImpl>) {
  return (
    <div style={{ height: props.height ?? 280 }}>
      <LazyCashflowChart {...props} />
    </div>
  );
}
