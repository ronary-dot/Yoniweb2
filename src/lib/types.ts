// Domain model — see docs/SPEC.md §9.

export type Mode = "family" | "business";

/** Amount in agorot (integer). Never a float. */
export type Money = number;

export interface Workspace {
  id: string;
  mode: Mode;
  name: string;
  currency: "ILS";
  /** 1–28 */
  cycleStartDay: number;
  safetyThreshold?: Money;
}

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  /** lucide icon name */
  icon: string;
  kind: "expense" | "income";
  monthlyBudget?: Money;
  archived: boolean;
}

export type PaymentMethod =
  | "card"
  | "cash"
  | "transfer"
  | "app"
  | "standing_order";

export interface Transaction {
  id: string;
  workspaceId: string;
  kind: "expense" | "income";
  /** Always positive; direction comes from `kind`. */
  amount: Money;
  categoryId: string;
  /** ISO yyyy-mm-dd */
  date: string;
  status: "actual" | "expected";
  paymentMethod?: PaymentMethod;
  note?: string;
  recurringId?: string;
  invoiceId?: string;
  activityId?: string;
  linkedTransactionId?: string;
  createdAt: string;
}

export interface Recurring {
  id: string;
  workspaceId: string;
  template: Omit<Transaction, "id" | "date" | "status" | "createdAt">;
  frequency: "weekly" | "monthly" | "quarterly" | "semester" | "yearly";
  startDate: string;
  endDate?: string;
}

export interface Goal {
  id: string;
  workspaceId: string;
  name: string;
  emoji?: string;
  target: Money;
  deadline?: string;
  type: "saving" | "revenue" | "reserve";
  contributions: { date: string; amount: Money }[];
}

export interface Activity {
  id: string;
  member: string;
  name: string;
  provider?: string;
  cost: Money;
  frequency: "monthly" | "semester" | "yearly";
  schedule?: { weekday: number; time: string }[];
}

export interface ShoppingList {
  id: string;
  name: string;
  items: { id: string; label: string; qty?: string; done: boolean }[];
}

export interface Client {
  id: string;
  name: string;
  contact?: string;
  paymentTermsDays: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  amount: Money;
  vat: boolean;
  issuedAt: string;
  dueAt: string;
  payments: { date: string; amount: Money }[];
  /** `overdue` is derived, never stored. */
  status: "draft" | "sent" | "partial" | "paid";
}

export interface AppData {
  /** Bumped on every persisted-shape change; drives migrations. */
  version: number;
  workspaces: Workspace[];
  categories: Category[];
  transactions: Transaction[];
  recurring: Recurring[];
  goals: Goal[];
  activities: Activity[];
  shoppingLists: ShoppingList[];
  clients: Client[];
  invoices: Invoice[];
  isDemo: boolean;
}
