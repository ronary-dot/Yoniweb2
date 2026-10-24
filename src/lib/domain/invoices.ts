import type { Client, Invoice, Money } from "@/lib/types";

export type InvoiceStatus = Invoice["status"] | "overdue";

export function invoicePaid(invoice: Invoice): Money {
  return invoice.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function invoiceOpen(invoice: Invoice): Money {
  return Math.max(0, invoice.amount - invoicePaid(invoice));
}

/** Stored status, with "overdue" derived for sent invoices past their due date. */
export function invoiceStatus(invoice: Invoice, todayISO: string): InvoiceStatus {
  const paid = invoicePaid(invoice);
  if (paid >= invoice.amount) return "paid";
  if (invoice.status === "draft") return "draft";
  if (invoice.dueAt < todayISO) return "overdue";
  return paid > 0 ? "partial" : "sent";
}

export function daysOverdue(invoice: Invoice, todayISO: string): number {
  if (invoiceStatus(invoice, todayISO) !== "overdue") return 0;
  const [ty, tm, td] = todayISO.split("-").map(Number);
  const [dy, dm, dd] = invoice.dueAt.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(dy, dm - 1, dd)) / 86_400_000);
}

/** Average days from issue to final payment, over fully paid invoices. */
export function averageDaysToPay(invoices: Invoice[]): number | null {
  const paid = invoices.filter((i) => i.payments.length > 0 && invoicePaid(i) >= i.amount);
  if (paid.length === 0) return null;
  const days = paid.map((i) => {
    const last = i.payments.map((p) => p.date).sort().at(-1)!;
    const [ly, lm, ld] = last.split("-").map(Number);
    const [iy, im, id] = i.issuedAt.split("-").map(Number);
    return (Date.UTC(ly, lm - 1, ld) - Date.UTC(iy, im - 1, id)) / 86_400_000;
  });
  return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
}

export interface ClientSummary {
  client: Client;
  open: Money;
  overdue: Money;
  maxDaysOverdue: number;
  invoiceCount: number;
}

/** Per-client receivables, largest open balance first. Drafts aren't owed yet. */
export function clientSummaries(clients: Client[], invoices: Invoice[], todayISO: string): ClientSummary[] {
  return clients
    .map((client) => {
      const own = invoices.filter((i) => i.clientId === client.id);
      let open = 0;
      let overdue = 0;
      let maxDaysOverdue = 0;
      for (const i of own) {
        const status = invoiceStatus(i, todayISO);
        if (status === "draft" || status === "paid") continue;
        open += invoiceOpen(i);
        if (status === "overdue") {
          overdue += invoiceOpen(i);
          maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue(i, todayISO));
        }
      }
      return { client, open, overdue, maxDaysOverdue, invoiceCount: own.length };
    })
    .sort((a, b) => b.open - a.open);
}

export function nextInvoiceNumber(invoices: Invoice[]): string {
  const max = invoices.reduce((m, i) => Math.max(m, Number(i.number) || 0), 1000);
  return String(max + 1);
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "טיוטה",
  sent: "נשלחה",
  partial: "שולמה חלקית",
  paid: "שולמה",
  overdue: "באיחור",
};
