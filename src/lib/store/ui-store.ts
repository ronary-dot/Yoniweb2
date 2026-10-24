"use client";

import { create } from "zustand";

interface TransactionSheetState {
  open: boolean;
  /** Set when editing an existing transaction. */
  editingId: string | null;
  /** Opened from the keyboard: skip the enter animation (SPEC §11). */
  instant: boolean;
  openNew: (options?: { instant?: boolean }) => void;
  openEdit: (id: string) => void;
  close: () => void;
}

export const useTransactionSheet = create<TransactionSheetState>()((set) => ({
  open: false,
  editingId: null,
  instant: false,
  openNew: ({ instant = false } = {}) => set({ open: true, editingId: null, instant }),
  openEdit: (id) => set({ open: true, editingId: id, instant: false }),
  close: () => set({ open: false, instant: false }),
}));
