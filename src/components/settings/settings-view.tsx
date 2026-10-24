"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { fieldClass } from "@/components/ui/styles";
import { clearAllData, loadDemoData } from "@/lib/demo/actions";
import { amountToInput, parseAmount } from "@/lib/format";
import { MODES } from "@/lib/modes";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { Workspace } from "@/lib/types";

export function SettingsView() {
  const hydrated = useHasHydrated();
  const workspaces = useAppStore((s) => s.workspaces);
  const isDemo = useAppStore((s) => s.isDemo);

  return (
    <>
      <PageHeader title="הגדרות" />
      {hydrated && (
        <div className="flex flex-col gap-4">
          <AppearanceCard />
          {workspaces.map((w) => (
            <WorkspaceCard key={w.id} workspace={w} />
          ))}

          <Card>
            <h2 className="text-[15px] font-medium">נתונים</h2>
            <p className="mt-1 text-sm text-fg-muted">
              הנתונים נשמרים רק בדפדפן הזה. נתוני הדמו נבנים מחדש יחסית לתאריך של היום.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={loadDemoData}>
                <Sparkles aria-hidden className="size-4" />
                {isDemo ? "איפוס נתוני הדמו" : "טען נתוני דמו"}
              </Button>
              <Button variant="danger" size="sm" onClick={clearAllData}>
                <Trash2 aria-hidden className="size-4" />
                מחיקת כל הנתונים
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const updateWorkspace = useAppStore((s) => s.updateWorkspace);
  const { label, icon: Icon } = MODES[workspace.mode];

  return (
    <Card data-mode={workspace.mode}>
      <h2 className="flex items-center gap-2 text-[15px] font-medium">
        <Icon aria-hidden strokeWidth={1.75} className="size-4 text-accent" />
        {label}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">שם</span>
          <input
            value={workspace.name}
            maxLength={40}
            onChange={(e) => updateWorkspace(workspace.id, { name: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">המחזור מתחיל ב-</span>
          <select
            value={workspace.cycleStartDay}
            onChange={(e) => updateWorkspace(workspace.id, { cycleStartDay: Number(e.target.value) })}
            className={fieldClass}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d} לחודש
              </option>
            ))}
          </select>
        </label>
        {workspace.mode === "business" && (
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm text-fg-muted">סף בטיחות לתזרים (התראה כשהתחזית יורדת מתחתיו)</span>
            <input
              dir="ltr"
              inputMode="decimal"
              placeholder="₪"
              key={workspace.safetyThreshold ?? "none"}
              defaultValue={workspace.safetyThreshold ? amountToInput(workspace.safetyThreshold) : ""}
              onBlur={(e) => {
                const value = e.target.value.trim();
                updateWorkspace(workspace.id, { safetyThreshold: value ? (parseAmount(value) ?? undefined) : undefined });
              }}
              className={`${fieldClass} text-end tabular-nums sm:max-w-48`}
            />
          </label>
        )}
      </div>
    </Card>
  );
}

const THEMES = [
  { value: "system", label: "לפי המערכת" },
  { value: "light", label: "בהיר" },
  { value: "dark", label: "כהה" },
] as const;

function AppearanceCard() {
  const { theme = "system", setTheme } = useTheme();
  return (
    <Card>
      <h2 className="text-[15px] font-medium">תצוגה</h2>
      <Segmented
        label="ערכת צבעים"
        value={theme as (typeof THEMES)[number]["value"]}
        onChange={setTheme}
        options={THEMES}
        className="mt-4 w-full sm:w-fit"
      />
    </Card>
  );
}
