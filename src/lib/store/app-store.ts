"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createEmptyData, DATA_VERSION } from "@/lib/defaults";
import { createDemoData } from "@/lib/demo/seed";
import type { AppData, Category, Mode, Transaction, Workspace } from "@/lib/types";

export type TransactionInput = Omit<Transaction, "id" | "createdAt">;
export type CategoryInput = Omit<Category, "id" | "archived">;

interface AppState extends AppData {
  lastMode: Mode;
  /** Set once the person has picked demo data or an empty start. */
  onboarded: boolean;
  setLastMode: (mode: Mode) => void;
  replaceData: (data: AppData) => void;
  loadDemo: () => void;
  startEmpty: () => void;
  clearData: () => void;
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, "name" | "cycleStartDay">>) => void;

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
      onboarded: false,
      setLastMode: (lastMode) => set({ lastMode }),
      replaceData: (data) => set(data),
      loadDemo: () => set({ ...createDemoData(new Date()), onboarded: true }),
      startEmpty: () => set({ ...createEmptyData(), onboarded: true }),
      clearData: () => set(createEmptyData()),
      updateWorkspace: (id, patch) =>
        set((s) => ({ workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

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
      // Rehydrated from <StoreHydrator /> after mount, so server and first
      // client render agree.
      skipHydration: true,
      migrate: (persisted, version) => {
        const state = persisted as AppData & { onboarded?: boolean };
        if (version < 2) {
          // Onboarding arrived in v2; anyone with data has already started.
          state.onboarded = state.transactions.length > 0;
          // v2 added default categories (owner's draw); merge any missing ones.
          const existing = new Set(state.categories.map((c) => c.id));
          const missing = createEmptyData().categories.filter((c) => !existing.has(c.id));
          state.categories = [...state.categories, ...missing];
          state.version = 2;
        }
        return state as AppState;
      },
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

const DATA_KEYS = Object.keys(createEmptyData()) as (keyof AppData)[];

/** The persisted data portion of the store, e.g. for an undo snapshot. */
export function snapshotData(): AppData {
  const state = useAppStore.getState();
  return Object.fromEntries(DATA_KEYS.map((key) => [key, state[key]])) as unknown as AppData;
}

export function StoreHydrator() {
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);
  return null;
}
