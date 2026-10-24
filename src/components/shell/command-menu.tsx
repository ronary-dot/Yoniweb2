"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Command } from "cmdk";
import { ArrowLeftRight, Moon, Plus, Settings, Sparkles, Sun, SunMoon, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { WORKSPACE_ID } from "@/lib/defaults";
import { loadDemoData } from "@/lib/demo/actions";
import { parseQuickAdd } from "@/lib/domain/quick-add";
import { formatMoney, toISODate } from "@/lib/format";
import { hrefFor, MODES } from "@/lib/modes";
import { useAppStore } from "@/lib/store/app-store";
import { useTransactionSheet } from "@/lib/store/ui-store";
import type { Mode } from "@/lib/types";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  onSwitchMode: (mode: Mode) => void;
}

/**
 * ⌘K: navigation, actions and quick add ("הוצאה 120 סופר"). Opened many
 * times a day, so it has no open or close animation (SPEC §11).
 */
export function CommandMenu({ open, onOpenChange, mode, onSwitchMode }: CommandMenuProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const categories = useAppStore((s) => s.categories);
  const openNew = useTransactionSheet((s) => s.openNew);
  const [query, setQuery] = useState("");

  const other: Mode = mode === "family" ? "business" : "family";
  const quick = parseQuickAdd(
    query,
    categories.filter((c) => c.workspaceId === WORKSPACE_ID[mode]),
  );

  function run(action: () => void) {
    onOpenChange(false);
    setQuery("");
    action();
  }

  function quickAdd() {
    if (!quick) return;
    const { addTransaction, deleteTransaction } = useAppStore.getState();
    const added = addTransaction({
      workspaceId: WORKSPACE_ID[mode],
      kind: quick.kind,
      amount: quick.amount,
      categoryId: quick.category.id,
      date: toISODate(new Date()),
      status: "actual",
    });
    toast(`${quick.kind === "income" ? "הכנסה" : "הוצאה"} של ${formatMoney(quick.amount, { precise: quick.amount % 100 !== 0 })} נוספה ל${quick.category.name}`, {
      duration: 5000,
      action: { label: "ביטול", onClick: () => deleteTransaction(added.id) },
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 dark:bg-black/50" />
        <Dialog.Popup
          aria-label="חיפוש ופקודות"
          className="fixed top-[12vh] left-1/2 z-50 w-[36rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_var(--border),0_24px_48px_-12px_oklch(0_0_0/0.3)] outline-none"
        >
          <Command loop label="חיפוש ופקודות" className="flex max-h-[min(28rem,70dvh)] flex-col">
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="חיפוש, או ״הוצאה 120 סופר״"
              className="h-13 w-full shrink-0 border-b border-border bg-transparent px-4 text-[15px] outline-none placeholder:text-fg-muted"
            />
            <Command.List className="overflow-y-auto overscroll-contain p-2">
              {/* cmdk ignores force-mounted items when deciding it's empty. */}
              {!quick && <Command.Empty className="px-3 py-6 text-center text-sm text-fg-muted">אין תוצאות</Command.Empty>}

              {quick && (
                <Command.Group heading="הוספה מהירה" forceMount>
                  <Item value={`quick ${query}`} forceMount icon={<Zap />} onSelect={() => run(quickAdd)}>
                    {quick.kind === "income" ? "הכנסה" : "הוצאה"} של{" "}
                    <bdi className="font-medium tabular-nums">{formatMoney(quick.amount, { precise: quick.amount % 100 !== 0 })}</bdi> ·{" "}
                    {quick.category.name}
                  </Item>
                </Command.Group>
              )}

              <Command.Group heading="פעולות">
                <Item icon={<Plus />} onSelect={() => run(() => openNew({ instant: true }))}>
                  תנועה חדשה
                </Item>
                <Item icon={<ArrowLeftRight />} keywords={["מצב", MODES[other].label]} onSelect={() => run(() => onSwitchMode(other))}>
                  מעבר למצב {MODES[other].label}
                </Item>
                <Item icon={<Sparkles />} keywords={["דמו", "demo"]} onSelect={() => run(loadDemoData)}>
                  טעינת נתוני דמו
                </Item>
              </Command.Group>

              <Command.Group heading={`ניווט · ${MODES[mode].label}`}>
                {MODES[mode].nav.map(({ segment, label, icon: Icon }) => (
                  <Item key={segment} icon={<Icon />} onSelect={() => run(() => router.push(hrefFor(mode, segment)))}>
                    {label}
                  </Item>
                ))}
                <Item icon={<Settings />} onSelect={() => run(() => router.push("/settings"))}>
                  הגדרות
                </Item>
              </Command.Group>

              <Command.Group heading="ערכת צבעים">
                <Item icon={<Sun />} keywords={["theme", "light"]} onSelect={() => run(() => setTheme("light"))}>
                  בהירה
                </Item>
                <Item icon={<Moon />} keywords={["theme", "dark", "לילה"]} onSelect={() => run(() => setTheme("dark"))}>
                  כהה
                </Item>
                <Item icon={<SunMoon />} keywords={["theme", "system"]} onSelect={() => run(() => setTheme("system"))}>
                  לפי המערכת
                </Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Item({
  icon,
  children,
  ...props
}: { icon: ReactNode; children: ReactNode } & Omit<React.ComponentProps<typeof Command.Item>, "children">) {
  return (
    <Command.Item
      {...props}
      className="flex h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-fg data-[selected=true]:bg-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted [&_svg]:stroke-[1.75]"
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Command.Item>
  );
}
