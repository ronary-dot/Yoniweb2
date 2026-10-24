"use client";

import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store/app-store";
import { useTransactionSheet } from "@/lib/store/ui-store";
import type { Mode } from "@/lib/types";
import { TransactionForm } from "./transaction-form";

/** The single add/edit transaction surface, mounted once in the shell. */
export function TransactionSheet({ mode }: { mode: Mode }) {
  const { open, editingId, instant, close } = useTransactionSheet();
  const transaction = useAppStore((s) => s.transactions.find((t) => t.id === editingId));
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const restoreTransaction = useAppStore((s) => s.restoreTransaction);

  // Delete immediately and offer undo instead of asking for confirmation (SPEC §4.3).
  function onDelete(id: string) {
    const removed = deleteTransaction(id);
    close();
    if (!removed) return;
    toast("התנועה נמחקה", {
      duration: 5000,
      action: { label: "ביטול", onClick: () => restoreTransaction(removed) },
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && close()}
      title={editingId ? "עריכת תנועה" : "תנועה חדשה"}
      instant={instant}
    >
      <TransactionForm
        key={editingId ?? "new"}
        mode={mode}
        transaction={editingId ? transaction : undefined}
        onSaved={close}
        onDelete={onDelete}
      />
    </Sheet>
  );
}
