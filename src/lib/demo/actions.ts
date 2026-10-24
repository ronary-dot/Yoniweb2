"use client";

import { toast } from "sonner";
import { snapshotData, useAppStore } from "@/lib/store/app-store";

const UNDO_MS = 6000;

/** Loads (or resets) demo data; offers undo when it replaces real data. */
export function loadDemoData() {
  const before = snapshotData();
  const replacesRealData = !before.isDemo && before.transactions.length > 0;
  useAppStore.getState().loadDemo();
  if (replacesRealData) {
    toast("נתוני הדמו נטענו במקום הנתונים שלך", {
      duration: UNDO_MS,
      action: { label: "ביטול", onClick: () => useAppStore.getState().replaceData(before) },
    });
  } else {
    toast(before.isDemo ? "נתוני הדמו אופסו" : "נתוני הדמו נטענו");
  }
}

/** Wipes all data, with undo instead of a confirmation dialog (SPEC §4.3). */
export function clearAllData() {
  const before = snapshotData();
  useAppStore.getState().clearData();
  toast(before.isDemo ? "נתוני הדמו נוקו" : "כל הנתונים נמחקו", {
    duration: UNDO_MS,
    action: { label: "ביטול", onClick: () => useAppStore.getState().replaceData(before) },
  });
}
