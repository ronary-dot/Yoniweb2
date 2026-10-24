"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { fieldClass } from "@/components/ui/styles";
import { invoiceOpen, invoicePaid } from "@/lib/domain/invoices";
import { amountToInput, parseAmount, toISODate } from "@/lib/format";
import type { ClientInput, InvoiceInput } from "@/lib/store/app-store";
import type { Client, Invoice, Money as MoneyValue } from "@/lib/types";

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

export function ClientForm({
  client,
  canDelete,
  onSubmit,
  onDelete,
}: {
  client?: Client;
  canDelete: boolean;
  onSubmit: (input: ClientInput) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(client?.name ?? "");
  const [contact, setContact] = useState(client?.contact ?? "");
  const [terms, setTerms] = useState(String(client?.paymentTermsDays ?? 30));
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("נא להזין שם לקוח");
    onSubmit({ name: name.trim(), contact: contact.trim() || undefined, paymentTermsDays: Number(terms) });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-fg-muted">שם הלקוח</span>
        <input autoFocus={!client} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={fieldClass} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">איש קשר</span>
          <input value={contact} onChange={(e) => setContact(e.target.value)} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">תנאי תשלום</span>
          <select value={terms} onChange={(e) => setTerms(e.target.value)} className={fieldClass}>
            {[0, 15, 30, 45, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d === 0 ? "מיידי" : `שוטף + ${d}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="alert" className="min-h-5 text-sm text-negative">
        {error}
      </p>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="lg" className="flex-1">
          {client ? "שמירה" : "הוספת לקוח"}
        </Button>
        {onDelete && (
          <Button variant="danger" size="lg" onClick={onDelete} disabled={!canDelete} title={canDelete ? undefined : "יש ללקוח חשבוניות"}>
            מחיקה
          </Button>
        )}
      </div>
    </form>
  );
}

export function InvoiceForm({
  clients,
  invoice,
  defaultNumber,
  defaultClientId,
  onSubmit,
}: {
  clients: Client[];
  invoice?: Invoice;
  defaultNumber: string;
  defaultClientId?: string;
  onSubmit: (input: InvoiceInput) => void;
}) {
  const today = toISODate(new Date());
  const [clientId, setClientId] = useState(invoice?.clientId ?? defaultClientId ?? clients[0]?.id ?? "");
  const [number, setNumber] = useState(invoice?.number ?? defaultNumber);
  const [amount, setAmount] = useState(invoice ? amountToInput(invoice.amount) : "");
  const [vat, setVat] = useState(invoice?.vat ?? true);
  const [issuedAt, setIssuedAt] = useState(invoice?.issuedAt ?? today);
  const [dueAt, setDueAt] = useState(invoice?.dueAt ?? addDays(today, clients.find((c) => c.id === clientId)?.paymentTermsDays ?? 30));
  const [status, setStatus] = useState<"draft" | "sent">(invoice?.status === "draft" ? "draft" : "sent");
  const [error, setError] = useState<string | null>(null);

  // The due date follows the client's terms until edited by hand.
  function retarget(nextClientId: string, nextIssued: string) {
    const terms = clients.find((c) => c.id === nextClientId)?.paymentTermsDays ?? 30;
    setDueAt(addDays(nextIssued, terms));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!clientId) return setError("נא לבחור לקוח");
    const parsed = parseAmount(amount);
    if (parsed === null) return setError("נא להזין סכום תקין");
    if (dueAt < issuedAt) return setError("תאריך הפירעון לפני תאריך ההפקה");
    // A paid or partly paid invoice keeps its status; payments drive it.
    const nextStatus = invoice && invoice.payments.length > 0 ? invoice.status : status;
    onSubmit({ clientId, number: number.trim(), amount: parsed, vat, issuedAt, dueAt, status: nextStatus });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {!invoice?.payments.length && (
        <Segmented
          label="סטטוס"
          value={status}
          onChange={setStatus}
          options={[
            { value: "sent", label: "נשלחה" },
            { value: "draft", label: "טיוטה" },
          ]}
        />
      )}
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">לקוח</span>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              retarget(e.target.value, issuedAt);
            }}
            className={fieldClass}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">מספר</span>
          <input dir="ltr" value={number} onChange={(e) => setNumber(e.target.value)} className={`${fieldClass} text-end tabular-nums`} />
        </label>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">סכום</span>
          <input
            autoFocus={!invoice}
            dir="ltr"
            inputMode="decimal"
            placeholder="₪"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            className={`${fieldClass} text-end tabular-nums`}
          />
        </label>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} className="size-4 accent-(--accent)" />
          כולל מע״מ
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">תאריך הפקה</span>
          <input
            type="date"
            value={issuedAt}
            onChange={(e) => {
              setIssuedAt(e.target.value);
              retarget(clientId, e.target.value);
            }}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">לתשלום עד</span>
          <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={fieldClass} />
        </label>
      </div>
      <p role="alert" className="min-h-5 text-sm text-negative">
        {error}
      </p>
      <Button type="submit" variant="primary" size="lg">
        {invoice ? "שמירה" : "יצירת חשבונית"}
      </Button>
    </form>
  );
}

export function PaymentForm({ invoice, onSubmit }: { invoice: Invoice; onSubmit: (amount: MoneyValue, date: string) => void }) {
  const today = toISODate(new Date());
  const open = invoiceOpen(invoice);
  const [amount, setAmount] = useState(amountToInput(open));
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (parsed === null) return setError("נא להזין סכום תקין");
    if (parsed > open) return setError("הסכום גבוה מהיתרה הפתוחה");
    onSubmit(parsed, date);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted">
        יתרה פתוחה <Money value={open} className="font-medium text-fg" />
        {invoicePaid(invoice) > 0 && (
          <>
            {" · שולם עד כה "}
            <Money value={invoicePaid(invoice)} />
          </>
        )}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">התקבל</span>
          <input
            dir="ltr"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            className={`${fieldClass} text-end tabular-nums`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">בתאריך</span>
          <input type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </label>
      </div>
      <p role="alert" className="min-h-5 text-sm text-negative">
        {error}
      </p>
      <Button type="submit" variant="primary" size="lg">
        רישום תשלום
      </Button>
    </form>
  );
}
