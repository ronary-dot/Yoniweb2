"use client";

import { Briefcase, House, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { loadDemoData } from "@/lib/demo/actions";
import { useAppStore } from "@/lib/store/app-store";

/** First-run screen (SPEC §8.1). Seen once, so it may enter with a stagger. */
export function WelcomeView() {
  const router = useRouter();

  function startDemo() {
    loadDemoData();
    router.push("/family");
  }

  function startEmpty() {
    useAppStore.getState().startEmpty();
    router.push("/family");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <Stagger index={0}>
        <p className="mb-3 text-sm font-medium text-accent">Yoniweb2</p>
        <h1 className="text-[clamp(2rem,7vw,2.75rem)] leading-[1.1] font-semibold tracking-tight">
          התקציב של הבית ושל העסק, במקום אחד.
        </h1>
        <p className="mt-4 text-[17px] text-fg-muted">
          שני מצבים שעוברים ביניהם בלחיצה, כדי שהכסף של הבית לא יתערבב עם הכסף של העסק.
        </p>
      </Stagger>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Stagger index={1}>
          <ModeCard mode="family" icon={<House aria-hidden strokeWidth={1.75} className="size-5" />} title="משפחה">
            הוצאות משק בית, חוגים, קניות ויעדי חיסכון.
          </ModeCard>
        </Stagger>
        <Stagger index={2}>
          <ModeCard mode="business" icon={<Briefcase aria-hidden strokeWidth={1.75} className="size-5" />} title="עסק">
            תזרים מזומנים, הכנסות מלקוחות והוצאות תפעול.
          </ModeCard>
        </Stagger>
      </div>

      <Stagger index={3} className="mt-10 flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" size="lg" onClick={startDemo}>
          <Sparkles aria-hidden className="size-4" />
          טען נתוני דמו
        </Button>
        <Button variant="ghost" size="lg" onClick={startEmpty}>
          התחל עם אפליקציה ריקה
        </Button>
      </Stagger>

      <Stagger index={4}>
        <p className="mt-6 text-xs text-fg-muted">
          אין צורך בהרשמה. הנתונים נשמרים רק בדפדפן הזה, ואפשר לאפס את הדמו בכל רגע מההגדרות.
        </p>
      </Stagger>
    </main>
  );
}

function Stagger({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <div className={`welcome-enter ${className ?? ""}`} style={{ "--i": index } as CSSProperties}>
      {children}
    </div>
  );
}

function ModeCard({
  mode,
  icon,
  title,
  children,
}: {
  mode: "family" | "business";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div data-mode={mode} className="h-full rounded-2xl bg-surface p-5 shadow-card">
      <span className="mb-3 grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-fg-muted">{children}</p>
    </div>
  );
}
