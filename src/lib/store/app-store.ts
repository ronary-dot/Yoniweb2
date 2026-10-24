"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createEmptyData, DATA_VERSION } from "@/lib/defaults";
import type { AppData, Category, Mode, Transaction } from "@/lib/types";

export type TransactionInput = Omit<Transaction, "id" | "createdAt">;
export type CategoryInput = Omit<Category, "id" | "archived">;

interface AppState extends AppData {
  lastMode: Mode;
  setLastMode: (mode: Mode) => void;
  replaceData: (data: AppData) => void;
  clearData: () => void;

  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, patch: Partial<TransactionInput>) => void;
  /** Returns the removed transaction so the caller can offer undo. */
  deleteTransaction: (id: string) => Transaction | undefined;
  restoreTransaction: (transaction: Transaction) => void;

  addCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id" | "workspaceId">>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createEmptyData(),
      lastMode: "family",
      setLastMode: (lastMode) => set({ lastMode }),
      replaceData: (data) => set(data),
      clearData: () => set(createEmptyData()),

      addTransaction: (input) => {
        const transaction: Transaction = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ transactions: [...s.transactions, transaction] }));
        return transaction;
      },
      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTransaction: (id) => {
        const removed = get().transactions.find((t) => t.id === id);
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
        return removed;
      },
      restoreTransaction: (transaction) =>
        set((s) => ({ transactions: [...s.transactions, transaction] })),

      addCategory: (input) => {
        const category: Category = { ...input, id: crypto.randomUUID(), archived: false };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
    }),
    {
      name: "yoniweb2",
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated from <AppShell /> after mount, so server and first client
      // render agree.
      skipHydration: true,
    },
  ),
);

function subscribeHydration(onChange: () => void) {
  return useAppStore.persist.onFinishHydration(onChange);
}

/** False on the server and until persisted data has been read. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}
