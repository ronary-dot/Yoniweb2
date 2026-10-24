import clsx from "clsx";
import { createElement } from "react";
import { categoryIcon } from "@/lib/category-icons";

/** Renders a category's stored icon name as its lucide glyph. */
export function CategoryGlyph({ icon, className }: { icon: string; className?: string }) {
  // createElement: the component is looked up from a static map, not created here.
  return createElement(categoryIcon(icon), { "aria-hidden": true, strokeWidth: 1.75, className });
}

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx("grid size-9 shrink-0 place-items-center rounded-[10px] bg-hover text-fg-muted", className)}
    >
      <CategoryGlyph icon={icon} className="size-[18px]" />
    </span>
  );
}
