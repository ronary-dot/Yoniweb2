"use client";

import { useMemo } from "react";
import { WORKSPACE_ID } from "@/lib/defaults";
import { type Cycle, shiftCycle } from "@/lib/domain/period";
import { useAppStore } from "@/lib/store/app-store";
import type { Mode } from "@/lib/types";

/**
 * The workspace's budget cycle, `offset` cycles from the current one. Only
 * call once the store has hydrated: it reads today's date.
 */
export function useCycle(mode: Mode, offset = 0): Cycle {
  const startDay = useAppStore(
    (s) => s.workspaces.find((w) => w.id === WORKSPACE_ID[mode])?.cycleStartDay ?? 1,
  );
  return useMemo(() => shiftCycle(new Date(), startDay, offset), [startDay, offset]);
}
