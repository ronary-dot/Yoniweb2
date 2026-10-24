"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Skip enter/exit transitions, e.g. when opened from the keyboard. */
  instant?: boolean;
  children: ReactNode;
}

const backdropClass =
  "fixed inset-0 z-50 min-h-dvh bg-black/25 dark:bg-black/60 supports-[-webkit-touch-callout:none]:absolute";

/**
 * A modal surface that is a centered Dialog on desktop and a swipeable bottom
 * Drawer on mobile (SPEC §11).
 */
export function Sheet({ open, onOpenChange, title, instant, children }: SheetProps) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const instantAttr = instant ? "" : undefined;

  if (desktop) {
    return (
      <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
        <Dialog.Portal>
          <Dialog.Backdrop
            data-instant={instantAttr}
            className={`${backdropClass} transition-opacity duration-200 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:opacity-0 data-instant:duration-0`}
          />
          <Dialog.Popup
            data-instant={instantAttr}
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(42rem,calc(100dvh-4rem))] w-[28rem] max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_var(--border),0_24px_48px_-12px_oklch(0_0_0/0.25)] outline-none transition-[scale,opacity] duration-200 ease-(--ease-out) data-ending-style:scale-96 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-96 data-starting-style:opacity-0 data-instant:duration-0"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              <Dialog.Close
                aria-label="סגירה"
                className="pressable -me-2 grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg"
              >
                <X aria-hidden className="size-4" />
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop
            data-instant={instantAttr}
            className={`${backdropClass} opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[400ms] ease-(--ease-drawer) data-swiping:duration-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*300ms)] data-starting-style:opacity-0 data-instant:duration-0`}
          />
          <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
            <Drawer.Popup
              data-instant={instantAttr}
              className="-mb-12 flex max-h-[calc(92dvh+3rem)] w-full flex-col rounded-t-[20px] bg-surface pb-[calc(env(safe-area-inset-bottom,0px)+3rem)] shadow-[0_-1px_0_var(--border)] outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[400ms] ease-(--ease-drawer) data-swiping:select-none data-ending-style:[transform:translateY(calc(100%-3rem+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*300ms)] data-starting-style:[transform:translateY(calc(100%-3rem+2px))] data-instant:duration-0"
            >
              <div aria-hidden className="mx-auto mt-2.5 mb-1 h-1 w-9 shrink-0 rounded-full bg-fg/15" />
              <Drawer.Title className="px-5 pt-2 pb-3 text-base font-semibold">{title}</Drawer.Title>
              <Drawer.Content className="overflow-y-auto overscroll-contain px-5 pb-5">
                {children}
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}
