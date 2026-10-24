"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createEmptyData, DATA_VERSION, WORKSPACE_ID } from "@/lib/defaults";
import { createDemoData } from "@/lib/demo/seed";
import { paymentDates } from "@/lib/domain/activities";
import { settleDue } from "@/lib/domain/settle";
import { toISODate } from "@/lib/format";
import type { Activity, AppData, Category, Goal, Mode, Money, ShoppingList, Transaction, Workspace } from "@/lib/types";

export type TransactionInput = Omit<Transaction, "id" | "createdAt">;
export type CategoryInput = Omit<Category, "id" | "archived">;
export type ActivityInput = Omit<Activity, "id">;
export type GoalInput = Omit<Goal, "id" | "contributions">;

/** How far ahead activity fees are scheduled as expected transactions. */
const ACTIVITY_HORIZON_MONTHS = 3;

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

  /** Marks expected transactions whose date has arrived as actual. */
  settle: () => void;

  addActivity: (input: ActivityInput) => void;
  updateActivity: (id: string, input: ActivityInput) => void;
  deleteActivity: (id: string) => void;

  addShoppingList: (name: string) => string;
  renameShoppingList: (id: string, name: string) => void;
  deleteShoppingList: (id: string) => void;
  addShoppingItem: (listId: string, label: string) => void;
  toggleShoppingItem: (listId: string, itemId: string) => void;
  removeShoppingItem: (listId: string, itemId: string) => void;
  /** Records the trip as a grocery expense and clears the checked items. */
  checkoutShoppingList: (listId: string, amount: Money) => void;

  addGoal: (input: GoalInput) => void;
  updateGoal: (id: string, input: GoalInput) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: Money) => void;
}

/**
 * Replaces an activity's future fees with a fresh schedule. Past payments are
 * history and stay as they were.
 */
function withActivitySchedule(transactions: Transaction[], activity: Activity | null, activityId: string) {
  const today = new Date();
  const tomorrow = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const kept = transactions.filter((t) => !(t.activityId === activityId && t.status === "expected"));
  if (!activity) return kept;
  const until = toISODate(new Date(today.getFullYear(), today.getMonth() + ACTIVITY_HORIZON_MONTHS + 1, 0));
  const scheduled = paymentDates(activity, tomorrow, until).map(
    (date): Transaction => ({
      id: crypto.randomUUID(),
      workspaceId: WORKSPACE_ID.family,
      kind: "expense",
      amount: activity.cost,
      categoryId: "family-activities",
      date,
      status: "expected",
      paymentMethod: "card",
      note: `${activity.name} – ${activity.member}`,
      activityId,
      createdAt: new Date().toISOString(),
    }),
  );
  return [...kept, ...scheduled];
}

function mapList(lists: ShoppingList[], id: string, fn: (list: ShoppingList) => ShoppingList) {
  return lists.map((l) => (l.id === id ? fn(l) : l));
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

      settle: () =>
        set((s) => {
          const transactions = settleDue(s.transactions, toISODate(new Date()));
          return transactions === s.transactions ? {} : { transactions };
        }),

      addActivity: (input) => {
        const activity: Activity = { ...input, id: crypto.randomUUID() };
        set((s) => ({
          activities: [...s.activities, activity],
          transactions: withActivitySchedule(s.transactions, activity, activity.id),
        }));
      },
      updateActivity: (id, input) => {
        const activity: Activity = { ...input, id };
        set((s) => ({
          activities: s.activities.map((a) => (a.id === id ? activity : a)),
          transactions: withActivitySchedule(s.transactions, activity, id),
        }));
      },
      deleteActivity: (id) =>
        set((s) => ({
          activities: s.activities.filter((a) => a.id !== id),
          transactions: withActivitySchedule(s.transactions, null, id),
        })),

      addShoppingList: (name) => {
        const id = crypto.randomUUID();
        set((s) => ({ shoppingLists: [...s.shoppingLists, { id, name, items: [] }] }));
        return id;
      },
      renameShoppingList: (id, name) =>
        set((s) => ({ shoppingLists: mapList(s.shoppingLists, id, (l) => ({ ...l, name })) })),
      deleteShoppingList: (id) => set((s) => ({ shoppingLists: s.shoppingLists.filter((l) => l.id !== id) })),
      addShoppingItem: (listId, label) =>
        set((s) => ({
          shoppingLists: mapList(s.shoppingLists, listId, (l) => ({
            ...l,
            items: [...l.items, { id: crypto.randomUUID(), label, done: false }],
          })),
        })),
      toggleShoppingItem: (listId, itemId) =>
        set((s) => ({
          shoppingLists: mapList(s.shoppingLists, listId, (l) => ({
            ...l,
            items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
          })),
        })),
      removeShoppingItem: (listId, itemId) =>
        set((s) => ({
          shoppingLists: mapList(s.shoppingLists, listId, (l) => ({
            ...l,
            items: l.items.filter((i) => i.id !== itemId),
          })),
        })),
      checkoutShoppingList: (listId, amount) => {
        const list = get().shoppingLists.find((l) => l.id === listId);
        if (!list) return;
        get().addTransaction({
          workspaceId: WORKSPACE_ID.family,
          kind: "expense",
          amount,
          categoryId: "family-groceries",
          date: toISODate(new Date()),
          status: "actual",
          paymentMethod: "card",
          note: list.name,
        });
        set((s) => ({
          shoppingLists: mapList(s.shoppingLists, listId, (l) => ({ ...l, items: l.items.filter((i) => !i.done) })),
        }));
      },

      addGoal: (input) =>
        set((s) => ({ goals: [...s.goals, { ...input, id: crypto.randomUUID(), contributions: [] }] })),
      updateGoal: (id, input) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...input } : g)) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      contributeToGoal: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, contributions: [...g.contributions, { date: toISODate(new Date()), amount }] } : g,
          ),
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
    void Promise.resolve(useAppStore.persist.rehydrate()).then(() => useAppStore.getState().settle());
  }, []);
  return null;
}
