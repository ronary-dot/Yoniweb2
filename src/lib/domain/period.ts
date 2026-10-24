import { toISODate } from "@/lib/format";

/** A budget cycle, inclusive on both ends, as ISO yyyy-mm-dd strings. */
export interface Cycle {
  start: string;
  end: string;
}

/** The cycle containing `date`, for cycles that start on `startDay` (1–28). */
export function cycleFor(date: Date, startDay: number): Cycle {
  const year = date.getFullYear();
  const month = date.getMonth() - (date.getDate() < startDay ? 1 : 0);
  return {
    start: toISODate(new Date(year, month, startDay)),
    end: toISODate(new Date(year, month + 1, startDay - 1)),
  };
}

/** The cycle `offset` cycles away from the one containing `date`. */
export function shiftCycle(date: Date, startDay: number, offset: number): Cycle {
  const { start } = cycleFor(date, startDay);
  const [y, m] = start.split("-").map(Number);
  return cycleFor(new Date(y, m - 1 + offset, startDay), startDay);
}

export function inCycle(isoDate: string, cycle: Cycle): boolean {
  return isoDate >= cycle.start && isoDate <= cycle.end;
}

/** Days from `today` through the cycle's last day, inclusive; 0 once it has ended. */
export function daysLeft(today: Date, cycle: Cycle): number {
  const [y, m, d] = cycle.end.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(0, days);
}

const monthYear = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });
const dayMonth = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "אוקטובר 2026" for calendar-month cycles, otherwise "10 בספט׳ – 9 באוק׳". */
export function cycleLabel(cycle: Cycle): string {
  const start = parseISO(cycle.start);
  if (start.getDate() === 1) return monthYear.format(start);
  return `${dayMonth.format(start)} – ${dayMonth.format(parseISO(cycle.end))}`;
}
