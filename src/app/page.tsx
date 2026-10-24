"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { loadDemoData } from "@/lib/demo/actions";
import { useAppStore, useHasHydrated } from "@/lib/store/app-store";

/**
 * Entry point: `/?demo=1` loads demo data (a shareable link, SPEC §8.1);
 * otherwise first-timers see the welcome screen and everyone else returns
 * to the mode they last used.
 */
export default function Home() {
  const router = useRouter();
  const hydrated = useHasHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const { onboarded, lastMode } = useAppStore.getState();
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      loadDemoData();
      router.replace("/family");
    } else {
      router.replace(onboarded ? `/${lastMode}` : "/welcome");
    }
  }, [hydrated, router]);

  return null;
}
