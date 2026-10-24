"use client";

import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CashPoint } from "@/lib/domain/cashflow";
import { formatMoney } from "@/lib/format";
import type { Money } from "@/lib/types";

interface CashflowChartProps {
  points: CashPoint[];
  todayISO: string;
  threshold?: Money;
  height?: number;
  compact?: boolean;
}

const tickFormat = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric" });
const tooltipFormat = new Intl.DateTimeFormat("he-IL", { weekday: "short", day: "numeric", month: "long" });

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shortShekels(agorot: number) {
  const shekels = agorot / 100;
  return Math.abs(shekels) >= 1000 ? `${Math.round(shekels / 1000)}K` : String(Math.round(shekels));
}

/**
 * Cash balance over time: solid area for history, dashed line for the
 * projection. Time runs left to right even in RTL (SPEC §10.4); values
 * change with a short 250ms transition (SPEC §6.2).
 */
export default function CashflowChart({ points, todayISO, threshold, height = 280, compact }: CashflowChartProps) {
  return (
    <div dir="ltr" style={{ height }} className="text-fg-muted [&_.recharts-surface]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="cash-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => tickFormat.format(parseISO(d))}
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
            minTickGap={compact ? 40 : 28}
          />
          <YAxis
            orientation="right"
            tickFormatter={shortShekels}
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
            width={36}
            hide={compact}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as CashPoint;
              const value = point.actual ?? point.projected ?? 0;
              return (
                <div dir="rtl" className="rounded-lg bg-surface px-3 py-2 text-xs shadow-card">
                  <p className="text-fg-muted">{tooltipFormat.format(parseISO(String(label)))}</p>
                  <p className="mt-0.5 text-sm font-medium text-fg tabular-nums">
                    {formatMoney(value)}
                    {point.actual === undefined && <span className="ms-1 text-xs font-normal text-fg-muted">צפוי</span>}
                  </p>
                </div>
              );
            }}
          />
          {threshold !== undefined && (
            <ReferenceLine y={threshold} stroke="var(--negative)" strokeDasharray="4 4" strokeOpacity={0.6} />
          )}
          <ReferenceLine x={todayISO} stroke="var(--border)" />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#cash-fill)"
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            animationDuration={250}
            animationEasing="ease-out"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
