import { toISODate } from "@/lib/format";
import type { Activity, Money } from "@/lib/types";

/** Payments are taken on this day of the month. */
export const ACTIVITY_PAYMENT_DAY = 10;
/** Semester fees are due in September and February (0-based months). */
const SEMESTER_MONTHS = [8, 1];
/** Yearly fees are due in September. */
const YEARLY_MONTH = 8;

const PER_YEAR: Record<Activity["frequency"], number> = { monthly: 12, semester: 2, yearly: 1 };

export function annualCost(activity: Activity): Money {
  return activity.cost * PER_YEAR[activity.frequency];
}

function isDueInMonth(activity: Activity, month: number): boolean {
  if (activity.frequency === "monthly") return true;
  if (activity.frequency === "semester") return SEMESTER_MONTHS.includes(month);
  return month === YEARLY_MONTH;
}

/** ISO dates of the activity's payments from `fromISO` through `toISO`, inclusive. */
export function paymentDates(activity: Activity, fromISO: string, toISO: string): string[] {
  const [fy, fm] = fromISO.split("-").map(Number);
  const dates: string[] = [];
  for (let i = 0; ; i++) {
    const date = new Date(fy, fm - 1 + i, ACTIVITY_PAYMENT_DAY);
    const iso = toISODate(date);
    if (iso > toISO) break;
    if (iso >= fromISO && isDueInMonth(activity, date.getMonth())) dates.push(iso);
  }
  return dates;
}

/** The next payment on or after `todayISO`, looking up to a year ahead. */
export function nextPayment(activity: Activity, todayISO: string): string | undefined {
  const [y, m, d] = todayISO.split("-").map(Number);
  return paymentDates(activity, todayISO, toISODate(new Date(y + 1, m - 1, d)))[0];
}

export const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const WEEKDAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export const FREQUENCY_LABEL: Record<Activity["frequency"], string> = {
  monthly: "לחודש",
  semester: "לסמסטר",
  yearly: "לשנה",
};
