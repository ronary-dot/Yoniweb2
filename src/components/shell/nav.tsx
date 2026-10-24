"use client";

import clsx from "clsx";
import Link from "next/link";
import { hrefFor, MODES } from "@/lib/modes";
import type { Mode } from "@/lib/types";

interface NavProps {
  mode: Mode;
  pathname: string;
}

function isActive(pathname: string, href: string, isDashboard: boolean) {
  return isDashboard ? pathname === href : pathname.startsWith(href);
}

export function SidebarNav({ mode, pathname }: NavProps) {
  return (
    <nav aria-label="ניווט ראשי" className="flex flex-col gap-0.5">
      {MODES[mode].nav.map(({ segment, label, icon: Icon }) => {
        const href = hrefFor(mode, segment);
        const active = isActive(pathname, href, segment === "");
        return (
          <Link
            key={segment}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150",
              active
                ? "bg-accent-soft font-medium text-fg"
                : "text-fg-muted hover:bg-hover hover:text-fg",
            )}
          >
            <Icon
              aria-hidden
              strokeWidth={1.75}
              className={clsx("size-[18px]", active && "text-accent")}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ mode, pathname }: NavProps) {
  const items = MODES[mode].nav.filter((item) => item.primary);
  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ segment, label, icon: Icon }) => {
          const href = hrefFor(mode, segment);
          const active = isActive(pathname, href, segment === "");
          return (
            <li key={segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "pressable flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-150",
                  active ? "font-medium text-accent" : "text-fg-muted",
                )}
              >
                <Icon aria-hidden strokeWidth={1.75} className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
