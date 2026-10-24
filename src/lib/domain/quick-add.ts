import { parseAmount } from "@/lib/format";
import type { Category, Money, Transaction } from "@/lib/types";

export interface QuickAdd {
  kind: Transaction["kind"];
  amount: Money;
  category: Category;
}

const INCOME_WORDS = ["הכנסה", "קיבלתי", "התקבל"];
const FILLER = new Set(["הוסף", "הוספת", "הוספה", "הוצאה", "הכנסה", "קיבלתי", "התקבל", "על", "של", "ב", "ל", "₪", "שח", "ש״ח"]);

/**
 * Reads "הוצאה 120 סופר" or "הכנסה 3500 משכורת" from the command palette
 * (SPEC §4.3). The amount is required; the category is the first whose
 * name shares a word with the query, else the workspace's catch-all.
 */
export function parseQuickAdd(query: string, categories: Category[]): QuickAdd | null {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const amountWord = words.find((w) => parseAmount(w.replace(/^₪/, "")) !== null);
  if (!amountWord) return null;
  const amount = parseAmount(amountWord.replace(/^₪/, ""))!;
  const kind: Transaction["kind"] = words.some((w) => INCOME_WORDS.includes(w)) ? "income" : "expense";

  const terms = words
    .filter((w) => w !== amountWord && !FILLER.has(w))
    .map((w) => w.replace(/^[בלה](?=\S{3,})/, ""))
    .filter((w) => w.length >= 2);
  const candidates = categories.filter((c) => c.kind === kind && !c.archived);
  const match =
    candidates.find((c) => terms.some((t) => c.name.includes(t))) ??
    candidates.find((c) => terms.some((t) => c.name.split(/\s+/).some((n) => t.includes(n) && n.length >= 2)));
  const fallback = candidates.find((c) => /-(misc|other-income)$/.test(c.id)) ?? candidates[0];
  const category = match ?? fallback;
  return category ? { kind, amount, category } : null;
}
