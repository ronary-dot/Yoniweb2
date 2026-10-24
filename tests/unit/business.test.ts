import { describe, expect, it } from "vitest";
import { cashOnHand, forecast, lowestPoint } from "@/lib/domain/cashflow";
import {
  averageDaysToPay,
  clientSummaries,
  daysOverdue,
  invoiceOpen,
  invoiceStatus,
  nextInvoiceNumber,
} from "@/lib/domain/invoices";
import type { Client, Invoice, Transaction } from "@/lib/types";

const ws = "ws-business";
const tx = (id: string, kind: Transaction["kind"], amount: number, date: string, status: Transaction["status"], extra: Partial<Transaction> = {}): Transaction => ({
  id, workspaceId: ws, kind, amount, categoryId: "c", date, status, createdAt: "", ...extra,
});

const today = "2026-10-24";
const transactions = [
  tx("open", "income", 10_000, "2026-09-01", "actual"),
  tx("rent", "expense", 2_000, "2026-10-01", "actual"),
  tx("late", "income", 5_000, "2026-10-10", "expected", { invoiceId: "i1" }), // past due: not counted
  tx("due-today", "income", 1_000, "2026-10-24", "expected"),
  tx("vat", "expense", 6_000, "2026-11-05", "expected"),
  tx("client", "income", 4_000, "2026-11-20", "expected"),
  tx("other-ws", "income", 99_999, "2026-10-02", "actual", { workspaceId: "ws-family" }),
];

describe("cashflow", () => {
  it("counts only actual cash up to today", () => {
    expect(cashOnHand(transactions, ws, today)).toBe(8_000);
  });

  it("projects forward, skipping past-due expected income", () => {
    const points = forecast(transactions, ws, today, { pastDays: 2, days: 30 });
    expect(points[0]).toEqual({ date: "2026-10-22", actual: 8_000 });
    const todayPoint = points.find((p) => p.date === today)!;
    expect(todayPoint).toEqual({ date: today, actual: 8_000, projected: 9_000 });
    expect(points.find((p) => p.date === "2026-11-05")!.projected).toBe(3_000);
    expect(points.find((p) => p.date === "2026-11-20")!.projected).toBe(7_000);
    expect(points.at(-1)!.date).toBe("2026-11-23");
    expect(lowestPoint(points)).toEqual({ date: "2026-11-05", balance: 3_000 });
  });

  it("moves postponed items later", () => {
    const points = forecast(transactions, ws, today, { pastDays: 0, days: 60, postponed: new Set(["client"]) });
    expect(points.find((p) => p.date === "2026-11-20")!.projected).toBe(3_000);
    expect(points.find((p) => p.date === "2026-12-20")!.projected).toBe(7_000);
  });
});

describe("invoices", () => {
  const invoice = (partial: Partial<Invoice>): Invoice => ({
    id: "i", clientId: "c1", number: "1001", amount: 10_000, vat: true, issuedAt: "2026-09-01", dueAt: "2026-10-01",
    payments: [], status: "sent", ...partial,
  });

  it("derives status", () => {
    expect(invoiceStatus(invoice({}), today)).toBe("overdue");
    expect(invoiceStatus(invoice({ dueAt: "2026-11-01" }), today)).toBe("sent");
    expect(invoiceStatus(invoice({ dueAt: "2026-11-01", payments: [{ date: today, amount: 4_000 }] }), today)).toBe("partial");
    expect(invoiceStatus(invoice({ payments: [{ date: today, amount: 10_000 }] }), today)).toBe("paid");
    expect(invoiceStatus(invoice({ status: "draft" }), today)).toBe("draft");
  });

  it("measures lateness and open balance", () => {
    expect(daysOverdue(invoice({}), today)).toBe(23);
    expect(daysOverdue(invoice({ dueAt: "2026-11-01" }), today)).toBe(0);
    expect(invoiceOpen(invoice({ payments: [{ date: today, amount: 4_000 }] }))).toBe(6_000);
  });

  it("averages days to pay over fully paid invoices", () => {
    expect(averageDaysToPay([invoice({ payments: [{ date: "2026-10-01", amount: 10_000 }] }), invoice({ payments: [{ date: "2026-09-11", amount: 10_000 }] }), invoice({})])).toBe(20);
    expect(averageDaysToPay([invoice({})])).toBeNull();
  });

  it("summarizes receivables per client, ignoring drafts", () => {
    const clients: Client[] = [
      { id: "c1", name: "א", paymentTermsDays: 30 },
      { id: "c2", name: "ב", paymentTermsDays: 30 },
    ];
    const summaries = clientSummaries(clients, [
      invoice({ id: "a" }),
      invoice({ id: "b", dueAt: "2026-11-30", amount: 3_000 }),
      invoice({ id: "c", clientId: "c2", status: "draft" }),
    ], today);
    expect(summaries[0]).toMatchObject({ open: 13_000, overdue: 10_000, maxDaysOverdue: 23 });
    expect(summaries[1]).toMatchObject({ open: 0, invoiceCount: 1 });
  });

  it("numbers invoices sequentially", () => {
    expect(nextInvoiceNumber([])).toBe("1001");
    expect(nextInvoiceNumber([invoice({ number: "1054" }), invoice({ number: "1003" })])).toBe("1055");
  });
});

describe("businessInsights on demo data", () => {
  it("flags the late client and the forecast nearing the threshold", async () => {
    const { createDemoData, DEMO_SAFETY_THRESHOLD } = await import("@/lib/demo/seed");
    const { businessInsights } = await import("@/lib/domain/insights");
    const data = createDemoData(new Date(2026, 9, 24));
    const insights = businessInsights({
      todayISO: today,
      workspaceId: ws,
      transactions: data.transactions,
      clients: data.clients,
      invoices: data.invoices,
      safetyThreshold: DEMO_SAFETY_THRESHOLD,
    });
    expect(insights.map((i) => i.id)).toEqual(["forecast-near", expect.stringMatching(/^overdue-/)]);
    expect(insights[1].text).toContain("מרפאת שן טובה באיחור של 35 ימים");
  });
});
