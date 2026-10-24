import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon aria-hidden strokeWidth={1.75} className="size-5" />
      </span>
      <h2 className="text-[15px] font-medium">{title}</h2>
      {children && <div className="mt-1 max-w-sm text-sm text-fg-muted">{children}</div>}
    </div>
  );
}
