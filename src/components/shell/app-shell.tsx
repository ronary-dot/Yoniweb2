"use client";

import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { MODES, modeFromPathname, switchModeHref } from "@/lib/modes";
import { useAppStore } from "@/lib/store/app-store";
import type { Mode } from "@/lib/types";
import { ModeSwitch } from "./mode-switch";
import { BottomNav, SidebarNav } from "./nav";

type SwitchSource = "pointer" | "keyboard";

function otherMode(mode: Mode): Mode {
  return mode === "family" ? "business" : "family";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mode = modeFromPathname(pathname) ?? "family";
  const setLastMode = useAppStore((s) => s.setLastMode);
  const [lastSwitch, setLastSwitch] = useState<{ to: Mode; via: SwitchSource } | null>(null);

  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setLastMode(mode);
  }, [mode, setLastMode]);

  const switchTo = useCallback(
    (target: Mode, via: SwitchSource) => {
      setLastSwitch({ to: target, via });
      router.push(switchModeHref(pathname, target));
    },
    [pathname, router],
  );

  // ⌘/Ctrl + . — keyboard switches are instant, never animated (SPEC §3.2).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "." && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        switchTo(otherMode(mode), "keyboard");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, switchTo]);

  const instant = lastSwitch?.via === "keyboard";
  const animateEnter = lastSwitch?.to === mode && lastSwitch.via === "pointer";
  const onSwitch = (target: Mode) => switchTo(target, "pointer");

  return (
    <div data-mode={mode} className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col gap-6 border-e border-border px-3 py-5 md:flex">
        <div className="px-2.5 text-[15px] font-semibold tracking-tight">Yoniweb2</div>
        <ModeSwitch mode={mode} onSwitch={onSwitch} instant={instant} />
        <SidebarNav mode={mode} pathname={pathname} />
        <p className="mt-auto px-2.5 text-xs text-fg-muted">
          <kbd className="font-sans">Ctrl .</kbd> למעבר בין מצבים
        </p>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center text-[15px] font-semibold tracking-tight">Yoniweb2</div>
        <ModeSwitch mode={mode} onSwitch={onSwitch} instant={instant} compact />
      </header>

      <main className="min-w-0 flex-1 px-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-10 md:pt-10 md:pb-10">
        <div key={mode} className={clsx("mx-auto max-w-[1120px]", animateEnter && "mode-enter")}>
          {children}
        </div>
      </main>

      <BottomNav mode={mode} pathname={pathname} />

      <p aria-live="polite" className="sr-only">
        {lastSwitch ? `מצב ${MODES[lastSwitch.to].label}` : ""}
      </p>
    </div>
  );
}
