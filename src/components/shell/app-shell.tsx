"use client";

import clsx from "clsx";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { Button } from "@/components/ui/button";
import { MODES, modeFromPathname, switchModeHref } from "@/lib/modes";
import { useAppStore } from "@/lib/store/app-store";
import { useTransactionSheet } from "@/lib/store/ui-store";
import type { Mode } from "@/lib/types";
import { DemoBanner } from "./demo-banner";
import { ModeSwitch } from "./mode-switch";
import { BottomNav, SettingsLink, SidebarNav } from "./nav";

type SwitchSource = "pointer" | "keyboard";

function otherMode(mode: Mode): Mode {
  return mode === "family" ? "business" : "family";
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pathMode = modeFromPathname(pathname);
  const lastMode = useAppStore((s) => s.lastMode);
  // Pages outside a mode (settings) keep the mode the person came from.
  const mode = pathMode ?? lastMode;
  const setLastMode = useAppStore((s) => s.setLastMode);
  const openNew = useTransactionSheet((s) => s.openNew);
  const [lastSwitch, setLastSwitch] = useState<{ to: Mode; via: SwitchSource } | null>(null);

  useEffect(() => {
    if (pathMode) setLastMode(pathMode);
  }, [pathMode, setLastMode]);

  useEffect(() => {
    // Portaled surfaces (sheets, toasts) sit outside the shell; mirror the
    // mode on <html> so they pick up the right accent.
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  const switchTo = useCallback(
    (target: Mode, via: SwitchSource) => {
      setLastSwitch({ to: target, via });
      router.push(switchModeHref(pathname, target));
    },
    [pathname, router],
  );

  // Keyboard actions are instant, never animated (SPEC §3.2, §11):
  // ⌘/Ctrl + . switches mode, N opens a new transaction.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "." && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        switchTo(otherMode(mode), "keyboard");
        return;
      }
      const plain = !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
      // `code` rather than `key`, so it works on a Hebrew layout too.
      if (plain && event.code === "KeyN" && !isTypingTarget(event.target) && !useTransactionSheet.getState().open) {
        event.preventDefault();
        openNew({ instant: true });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, switchTo, openNew]);

  const instant = lastSwitch?.via === "keyboard";
  const animateEnter = lastSwitch?.to === mode && lastSwitch.via === "pointer";
  const onSwitch = (target: Mode) => switchTo(target, "pointer");

  return (
    <div data-mode={mode} className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col gap-6 border-e border-border px-3 py-5 md:flex">
        <div className="px-2.5 text-[15px] font-semibold tracking-tight">Yoniweb2</div>
        <ModeSwitch mode={mode} onSwitch={onSwitch} instant={instant} />
        <Button variant="primary" onClick={() => openNew()} className="justify-start">
          <Plus aria-hidden className="size-4" />
          תנועה חדשה
          <kbd className="ms-auto rounded bg-white/20 px-1.5 font-sans text-xs">N</kbd>
        </Button>
        <SidebarNav mode={mode} pathname={pathname} />
        <div className="mt-auto flex flex-col gap-3">
          <SettingsLink pathname={pathname} />
          <p className="px-2.5 text-xs text-fg-muted">
            <kbd className="font-sans">Ctrl .</kbd> למעבר בין מצבים
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center text-[15px] font-semibold tracking-tight">Yoniweb2</div>
        <div className="flex items-center gap-1">
          <ModeSwitch mode={mode} onSwitch={onSwitch} instant={instant} compact />
          <Link
            href="/settings"
            aria-label="הגדרות"
            className="pressable grid size-9 place-items-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg"
          >
            <Settings aria-hidden strokeWidth={1.75} className="size-[18px]" />
          </Link>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-10 md:pt-10 md:pb-10">
        <div key={mode} className={clsx("mx-auto max-w-[1120px]", animateEnter && "mode-enter")}>
          <DemoBanner />
          {children}
        </div>
      </main>

      <BottomNav mode={mode} pathname={pathname} onAdd={() => openNew()} />
      <TransactionSheet mode={mode} />

      <p aria-live="polite" className="sr-only">
        {lastSwitch ? `מצב ${MODES[lastSwitch.to].label}` : ""}
      </p>
    </div>
  );
}
