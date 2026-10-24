"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";

/**
 * The status bar takes its color from <meta name="theme-color">. The
 * per-scheme tags only follow the OS, so a manual light/dark choice has to
 * repaint them (mobile-native skill §10).
 */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    // Normalize to rgb(): computed oklch colors serialize as lab(), which
    // not every browser accepts in theme-color.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const color = `rgb(${r}, ${g}, ${b})`;
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = color;
    }
  }, [resolvedTheme]);
  return null;
}

function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      dir="rtl"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-center"
      mobileOffset={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      toastOptions={{ className: "font-sans" }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <ThemeColorSync />
      <AppToaster />
    </ThemeProvider>
  );
}
