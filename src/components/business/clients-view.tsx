"use client";

import clsx from "clsx";
import { FileText, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import {
  averageDaysToPay,
  clientSummaries,
  daysOverdue,
  INVOICE_STATUS_LABEL,
  type InvoiceStatus,
  invoiceOpen,
  invoiceStatus,
  nextInvoiceNumber,
} from "@/lib/domain/invoices";
import { toISODate } from "@/lib/format";
import { snapshotData, useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { Client, Invoice } from "@/lib/types";
import { ClientForm, InvoiceForm, PaymentForm } from "./invoice-forms";

type Tab = "clients" | "invoices";
type SheetState =
  | { kind: "new-client" }
  | { kind: "client"; client: Client }
  | { kind: "new-invoice"; clientId?: string }
  | { kind: "invoice"; invoice: Invoice }
  | { kind: "payment"; invoice: Invoice };

const shortDate = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "2-digit" });
function formatISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return shortDate.format(new Date(y, m - 1, d));
}

const statusTone: Record<InvoiceStatus, string> = {
  draft: "bg-hover text-fg-muted",
  sent: "bg-accent-soft text-accent",
  partial: "bg-warning/15 text-warning",
  paid: "bg-positive/12 text-positive",
  overdue: "bg-negative/10 text-negative",
};

export function ClientsView() {
  const hydrated = useHasHydrated();
  const [tab, setTab] = useState<Tab>("clients");
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [open, setOpen] = useState(false);
  const show = (next: SheetState) => {
    setSheet(next);
    setOpen(true);
  };

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">לקוחות והכנסות</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => show({ kind: "new-client" })}>
            <Plus aria-hidden className="size-4" />
            לקוח
          </Button>
          <Button variant="primary" size="sm" onClick={() => show({ kind: "new-invoice" })}>
            <Plus aria-hidden className="size-4" />
            חשבונית
          </Button>
        </div>
      </header>
      {hydrated && (
        <>
          <Summary />
          <Segmented
            label="תצוגה"
            value={tab}
            onChange={setTab}
            options={[
              { value: "clients", label: "לקוחות" },
              { value: "invoices", label: "חשבוניות" },
            ]}
            className="mb-4 w-fit"
          />
          {tab === "clients" ? <ClientList onShow={show} /> : <InvoiceList onShow={show} />}
          <ClientsSheet sheet={sheet} open={open} onOpenChange={setOpen} onShow={show} />
        </>
      )}
    </>
  );
}

function Summary() {
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const todayISO = toISODate(new Date());
  const summaries = clientSummaries(clients, invoices, todayISO);
  const open = summaries.reduce((sum, s) => sum + s.open, 0);
  const overdue = summaries.reduce((sum, s) => sum + s.overdue, 0);
  const avgDays = averageDaysToPay(invoices);
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <Card className="p-4">
        <p className="text-xs text-fg-muted sm:text-sm">פתוח לגבייה</p>
        <p className="mt-1 text-lg font-semibold sm:text-2xl">
          <Money value={open} />
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-fg-muted sm:text-sm">באיחור</p>
        <p className={clsx("mt-1 text-lg font-semibold sm:text-2xl", overdue > 0 && "text-negative")}>
          <Money value={overdue} />
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-fg-muted sm:text-sm">ממוצע ימי גבייה</p>
        <p className="mt-1 text-lg font-semibold tabular-nums sm:text-2xl">{avgDays ?? "—"}</p>
      </Card>
    </div>
  );
}

function ClientList({ onShow }: { onShow: (s: SheetState) => void }) {
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const summaries = clientSummaries(clients, invoices, toISODate(new Date()));

  if (clients.length === 0) {
    return <EmptyState icon={Users} title="אין עדיין לקוחות">הוסיפו לקוח, ואז חשבונית — ההכנסה הצפויה תופיע בתחזית התזרים.</EmptyState>;
  }

  return (
    <ul className="-mx-2">
      {summaries.map(({ client, open, overdue, maxDaysOverdue, invoiceCount }) => (
        <li key={client.id}>
          <button
            type="button"
            onClick={() => onShow({ kind: "client", client })}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-start transition-colors duration-150 hover:bg-hover"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-hover text-sm font-medium text-fg-muted">
              {client.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{client.name}</span>
              <span className="block truncate text-xs text-fg-muted">
                {[client.contact, client.paymentTermsDays ? `שוטף + ${client.paymentTermsDays}` : "מיידי", `${invoiceCount} חשבוניות`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="shrink-0 text-end">
              <Money value={open} className="block text-sm font-medium" />
              {overdue > 0 && <span className="block text-xs text-negative">באיחור {maxDaysOverdue} ימים</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function InvoiceList({ onShow }: { onShow: (s: SheetState) => void }) {
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const todayISO = toISODate(new Date());
  const names = new Map(clients.map((c) => [c.id, c.name]));
  const sorted = [...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt) || b.number.localeCompare(a.number));

  if (invoices.length === 0) {
    return <EmptyState icon={FileText} title="אין עדיין חשבוניות" />;
  }

  return (
    <ul className="-mx-2">
      {sorted.map((invoice) => {
        const status = invoiceStatus(invoice, todayISO);
        return (
          <li key={invoice.id}>
            <button
              type="button"
              onClick={() => onShow({ kind: "invoice", invoice })}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-start transition-colors duration-150 hover:bg-hover"
            >
              <span className="w-12 shrink-0 text-xs text-fg-muted tabular-nums">#{invoice.number}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{names.get(invoice.clientId) ?? "לקוח"}</span>
                <span className="block text-xs text-fg-muted">לתשלום עד {formatISO(invoice.dueAt)}</span>
              </span>
              <span className="shrink-0 text-end">
                <Money value={invoice.amount} className="block text-sm font-medium" />
                <span className={clsx("mt-0.5 inline-block rounded-full px-2 py-px text-[11px] font-medium", statusTone[status])}>
                  {status === "overdue" ? `באיחור ${daysOverdue(invoice, todayISO)} ימים` : INVOICE_STATUS_LABEL[status]}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ClientsSheet({
  sheet,
  open,
  onOpenChange,
  onShow,
}: {
  sheet: SheetState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShow: (s: SheetState) => void;
}) {
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const { addClient, updateClient, deleteClient, addInvoice, updateInvoice, deleteInvoice, recordInvoicePayment } = useAppStore.getState();
  const close = () => onOpenChange(false);
  const todayISO = toISODate(new Date());

  const withUndo = (message: string, action: () => void) => {
    const before = snapshotData();
    action();
    close();
    toast(message, { duration: 5000, action: { label: "ביטול", onClick: () => useAppStore.getState().replaceData(before) } });
  };

  // Always show the live invoice, so a payment updates the open sheet.
  const liveInvoice =
    sheet && (sheet.kind === "invoice" || sheet.kind === "payment") ? invoices.find((i) => i.id === sheet.invoice.id) : undefined;

  const title = !sheet
    ? ""
    : {
        "new-client": "לקוח חדש",
        client: "עריכת לקוח",
        "new-invoice": "חשבונית חדשה",
        invoice: `חשבונית #${sheet.kind === "invoice" ? sheet.invoice.number : ""}`,
        payment: "רישום תשלום",
      }[sheet.kind];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      {sheet?.kind === "new-client" && (
        <ClientForm
          canDelete={false}
          onSubmit={(input) => {
            addClient(input);
            close();
          }}
        />
      )}
      {sheet?.kind === "client" && (
        <>
          <ClientForm
            key={sheet.client.id}
            client={sheet.client}
            canDelete={!invoices.some((i) => i.clientId === sheet.client.id)}
            onSubmit={(input) => {
              updateClient(sheet.client.id, input);
              close();
            }}
            onDelete={() => withUndo("הלקוח נמחק", () => deleteClient(sheet.client.id))}
          />
          <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => onShow({ kind: "new-invoice", clientId: sheet.client.id })}>
            <Plus aria-hidden className="size-4" />
            חשבונית ללקוח הזה
          </Button>
        </>
      )}
      {sheet?.kind === "new-invoice" &&
        (clients.length === 0 ? (
          <p className="text-sm text-fg-muted">כדי ליצור חשבונית, הוסיפו קודם לקוח.</p>
        ) : (
          <InvoiceForm
            key={sheet.clientId ?? "new"}
            clients={clients}
            defaultNumber={nextInvoiceNumber(invoices)}
            defaultClientId={sheet.clientId}
            onSubmit={(input) => {
              addInvoice(input);
              close();
              toast("החשבונית נוצרה, וההכנסה הצפויה נוספה לתחזית");
            }}
          />
        ))}
      {sheet?.kind === "invoice" && liveInvoice && (
        <>
          {invoiceOpen(liveInvoice) > 0 && invoiceStatus(liveInvoice, todayISO) !== "draft" && (
            <div className="mb-4 flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  recordInvoicePayment(liveInvoice.id, invoiceOpen(liveInvoice), todayISO);
                  close();
                  toast("החשבונית סומנה כשולמה, וההכנסה נרשמה");
                }}
              >
                סימון כשולם
              </Button>
              <Button onClick={() => onShow({ kind: "payment", invoice: liveInvoice })}>תשלום חלקי</Button>
            </div>
          )}
          <InvoiceForm
            key={liveInvoice.id}
            clients={clients}
            invoice={liveInvoice}
            defaultNumber={liveInvoice.number}
            onSubmit={(input) => {
              updateInvoice(liveInvoice.id, input);
              close();
            }}
          />
          <Button
            variant="danger"
            size="sm"
            className="mt-2 w-full"
            onClick={() => withUndo("החשבונית נמחקה", () => deleteInvoice(liveInvoice.id))}
          >
            מחיקת החשבונית
          </Button>
        </>
      )}
      {sheet?.kind === "payment" && liveInvoice && (
        <PaymentForm
          key={liveInvoice.id}
          invoice={liveInvoice}
          onSubmit={(amount, date) => {
            recordInvoicePayment(liveInvoice.id, amount, date);
            close();
            toast("התשלום נרשם");
          }}
        />
      )}
    </Sheet>
  );
}
