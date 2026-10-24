import {
  ArrowLeftRight,
  Briefcase,
  ChartColumn,
  House,
  LayoutDashboard,
  type LucideIcon,
  PiggyBank,
  Shapes,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Mode } from "./types";

export interface NavItem {
  /** Path segment after the mode; "" is the dashboard. */
  segment: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. */
  primary?: boolean;
}

export interface ModeConfig {
  mode: Mode;
  label: string;
  icon: LucideIcon;
  nav: NavItem[];
}

const shared = {
  dashboard: { segment: "", label: "דשבורד", icon: LayoutDashboard, primary: true },
  transactions: { segment: "transactions", label: "תנועות", icon: ArrowLeftRight, primary: true },
  budgets: { segment: "budgets", label: "תקציבים", icon: PiggyBank },
  goals: { segment: "goals", label: "יעדים", icon: Target, primary: true },
  reports: { segment: "reports", label: "דוחות", icon: ChartColumn },
} satisfies Record<string, NavItem>;

export const MODES: Record<Mode, ModeConfig> = {
  family: {
    mode: "family",
    label: "משפחה",
    icon: House,
    nav: [
      shared.dashboard,
      shared.transactions,
      { segment: "shopping", label: "קניות", icon: ShoppingCart, primary: true },
      { segment: "activities", label: "חוגים", icon: Shapes },
      shared.budgets,
      shared.goals,
      shared.reports,
    ],
  },
  business: {
    mode: "business",
    label: "עסק",
    icon: Briefcase,
    nav: [
      shared.dashboard,
      shared.transactions,
      { segment: "cashflow", label: "תזרים", icon: TrendingUp, primary: true },
      { segment: "clients", label: "לקוחות", icon: Users },
      shared.budgets,
      shared.goals,
      shared.reports,
    ],
  },
};

export const MODE_ORDER: Mode[] = ["family", "business"];

export function isMode(value: string | undefined): value is Mode {
  return value === "family" || value === "business";
}

export function modeFromPathname(pathname: string): Mode | null {
  const first = pathname.split("/")[1];
  return isMode(first) ? first : null;
}

export function hrefFor(mode: Mode, segment: string): string {
  return segment ? `/${mode}/${segment}` : `/${mode}`;
}

/**
 * Where to land when switching modes: the same kind of page if the target
 * mode has one, otherwise its dashboard (SPEC §3.2).
 */
export function switchModeHref(pathname: string, target: Mode): string {
  const segment = pathname.split("/")[2] ?? "";
  const exists = MODES[target].nav.some((item) => item.segment === segment);
  return hrefFor(target, exists ? segment : "");
}
