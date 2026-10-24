"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createEmptyData, DATA_VERSION } from "@/lib/defaults";
import type { AppData, Mode } from "@/lib/types";

interface AppState extends AppData {
  lastMode: Mode;
  setLastMode: (mode: Mode) => void;
  replaceData: (data: AppData) => void;
  clearData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...createEmptyData(),
      lastMode: "family",
      setLastMode: (lastMode) => set({ lastMode }),
      replaceData: (data) => set(data),
      clearData: () => set(createEmptyData()),
    }),
    {
      name: "yoniweb2",
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated from <StoreHydrator /> after mount, so server and first
      // client render agree.
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
