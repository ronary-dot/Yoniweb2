import clsx from "clsx";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-accent text-white hover:brightness-105",
  secondary: "bg-surface text-fg shadow-card hover:bg-hover",
  ghost: "text-fg-muted hover:bg-hover hover:text-fg",
  danger: "text-negative hover:bg-negative/10",
};

const sizes = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-5 text-[15px]",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "pressable inline-flex items-center justify-center rounded-[10px] font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
