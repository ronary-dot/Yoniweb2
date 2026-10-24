"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/format";

export interface MonthDatum {
  label: string;
  income: number;
  expense: number;
  net: number;
}

function shortShekels(agorot: number) {
  const shekels = agorot / 100;
  if (Math.abs(shekels) >= 1_000_000) return `${Math.round(shekels / 100_000) / 10}M`;
  return Math.abs(shekels) >= 1000 ? `${Math.round(shekels / 1000)}K` : String(Math.round(shekels));
}

const axisProps = {
  tick: { fontSize: 11, fill: "currentColor" },
  tickLine: false,
  axisLine: false,
} as const;

function TooltipCard({ title, rows }: { title: string; rows: { label: string; value: number; color?: string }[] }) {
  return (
    <div dir="rtl" className="rounded-lg bg-surface px-3 py-2 text-xs shadow-card">
      <p className="mb-1 text-fg-muted">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-1.5 text-fg">
          {r.color && <span aria-hidden className="size-2 rounded-sm" style={{ background: r.color }} />}
          <span className="text-fg-muted">{r.label}</span>
          <span className="ms-auto font-medium tabular-nums">{formatMoney(r.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Income and expenses per month: two validated categorical series, grouped. */
export function IncomeExpenseChart({ data, height = 260 }: { data: MonthDatum[]; height?: number }) {
  return (
    <div dir="ltr" style={{ height }} className="text-fg-muted">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <XAxis dataKey="label" {...axisProps} />
          <YAxis orientation="right" tickFormatter={shortShekels} width={36} {...axisProps} />
          <Tooltip
            cursor={{ fill: "var(--hover)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipCard
                  title={String(label)}
                  rows={[
                    { label: "הכנסות", value: Number(payload[0].payload.income), color: "var(--series-1)" },
                    { label: "הוצאות", value: Number(payload[0].payload.expense), color: "var(--series-2)" },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="income" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={400} />
          <Bar dataKey="expense" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={400} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Net per month around a zero baseline; one series, so no legend. */
export function NetChart({ data, height = 200 }: { data: MonthDatum[]; height?: number }) {
  return (
    <div dir="ltr" style={{ height }} className="text-fg-muted">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <XAxis dataKey="label" {...axisProps} />
          <YAxis orientation="right" tickFormatter={shortShekels} width={36} {...axisProps} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Tooltip
            cursor={{ fill: "var(--hover)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipCard title={String(label)} rows={[{ label: "נטו", value: Number(payload[0].payload.net) }]} />
              ) : null
            }
          />
          <Bar dataKey="net" radius={[4, 4, 4, 4]} maxBarSize={22} animationDuration={400}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.net < 0 ? "var(--fg-muted)" : "var(--accent)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
