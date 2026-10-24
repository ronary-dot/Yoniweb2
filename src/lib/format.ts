import type { Money } from "./types";

const currency = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(agorot: Money, { precise = false } = {}): string {
  return (precise ? currencyPrecise : currency).format(agorot / 100);
}

/**
 * Parses user input like "1,234.5" or "₪ 80" into agorot. Returns null for
 * anything that isn't a positive amount with at most two decimals.
 */
export function parseAmount(input: string): Money | null {
  const cleaned = input.replace(/[₪,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const agorot = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return agorot > 0 ? agorot : null;
}

/** Agorot back to an editable string: 123450 → "1234.5". */
export function amountToInput(agorot: Money): string {
  return String(agorot / 100);
}

/** ISO yyyy-mm-dd in local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
