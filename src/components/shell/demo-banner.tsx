"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { clearAllData, loadDemoData } from "@/lib/demo/actions";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";

/** A quiet strip shown while demo data is loaded (SPEC §8.1). */
export function DemoBanner() {
  const hydrated = useHasHydrated();
  const isDemo = useAppStore((s) => s.isDemo);
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated || !isDemo || dismissed) return null;

  const link = "rounded px-1 font-medium text-fg underline decoration-fg/25 underline-offset-4 hover:decoration-fg";

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-accent-soft py-2 ps-4 pe-2 text-sm">
      <p className="min-w-0 flex-1">
        <span className="text-fg-muted">מוצגים נתוני דמו.</span>{" "}
        <button type="button" className={link} onClick={loadDemoData}>
          איפוס
        </button>
        <span className="text-fg-muted"> · </span>
        <button type="button" className={link} onClick={clearAllData}>
          ניקוי והתחלה מחדש
        </button>
      </p>
      <button
        type="button"
        aria-label="הסתרה"
        onClick={() => setDismissed(true)}
        className="pressable grid size-7 shrink-0 place-items-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
