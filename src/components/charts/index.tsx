"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ChartImpl from "./cashflow-chart";
import type { MonthDatum } from "./report-charts";

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

const lazyReport = <K extends "IncomeExpenseChart" | "NetChart">(name: K) =>
  dynamic(() => import("./report-charts").then((m) => m[name]), {
    ssr: false,
    loading: () => <div className="h-full animate-pulse rounded-xl bg-hover" />,
  });

const LazyIncomeExpense = lazyReport("IncomeExpenseChart");
const LazyNet = lazyReport("NetChart");

type ReportProps = { data: MonthDatum[]; height?: number };

export function IncomeExpenseChart(props: ReportProps) {
  return (
    <div style={{ height: props.height ?? 260 }}>
      <LazyIncomeExpense {...props} />
    </div>
  );
}

export function NetChart(props: ReportProps) {
  return (
    <div style={{ height: props.height ?? 200 }}>
      <LazyNet {...props} />
    </div>
  );
}
