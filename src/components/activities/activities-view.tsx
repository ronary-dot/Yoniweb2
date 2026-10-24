"use client";

import clsx from "clsx";
import { Plus, Shapes } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { fieldClass } from "@/components/ui/styles";
import { annualCost, FREQUENCY_LABEL, nextPayment, WEEKDAYS_SHORT } from "@/lib/domain/activities";
import { amountToInput, parseAmount, toISODate } from "@/lib/format";
import { type ActivityInput, snapshotData, useAppStore, useHasHydrated } from "@/lib/store/app-store";
import type { Activity } from "@/lib/types";

const FREQUENCIES = [
  { value: "monthly", label: "חודשי" },
  { value: "semester", label: "סמסטריאלי" },
  { value: "yearly", label: "שנתי" },
] as const;

const shortDate = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });

export function ActivitiesView() {
  const hydrated = useHasHydrated();
  const [editing, setEditing] = useState<Activity | "new" | null>(null);
  const [open, setOpen] = useState(false);
  const show = (target: Activity | "new") => {
    setEditing(target);
    setOpen(true);
  };

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">חוגים</h1>
        <Button size="sm" onClick={() => show("new")}>
          <Plus aria-hidden className="size-4" />
          חוג חדש
        </Button>
      </header>
      {hydrated && <ActivitiesContent onEdit={show} />}
      <Sheet open={open} onOpenChange={setOpen} title={editing === "new" ? "חוג חדש" : "עריכת חוג"}>
        {editing && (
          <ActivityForm
            key={editing === "new" ? "new" : editing.id}
            activity={editing === "new" ? undefined : editing}
            onDone={() => setOpen(false)}
          />
        )}
      </Sheet>
    </>
  );
}

function ActivitiesContent({ onEdit }: { onEdit: (a: Activity) => void }) {
  const activities = useAppStore((s) => s.activities);
  const todayISO = toISODate(new Date());

  const byMember = useMemo(() => {
    const groups = new Map<string, Activity[]>();
    for (const a of activities) groups.set(a.member, [...(groups.get(a.member) ?? []), a]);
    return [...groups];
  }, [activities]);

  if (activities.length === 0) {
    return <EmptyState icon={Shapes} title="אין עדיין חוגים">הוסיפו חוג, והתשלומים שלו יופיעו אוטומטית בתזרים.</EmptyState>;
  }

  const total = activities.reduce((sum, a) => sum + annualCost(a), 0);

  return (
    <>
      <Card className="mb-6">
        <p className="text-sm text-fg-muted">עלות שנתית לכל החוגים</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          <Money value={total} />
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {byMember.map(([member, items]) => (
            <li key={member}>
              <span className="text-fg-muted">{member} </span>
              <Money value={items.reduce((sum, a) => sum + annualCost(a), 0)} className="font-medium" />
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col gap-8">
        {byMember.map(([member, items]) => (
          <section key={member}>
            <h2 className="mb-2 text-xs font-medium text-fg-muted">{member}</h2>
            <ul className="-mx-2">
              {items.map((a) => {
                const next = nextPayment(a, todayISO);
                const [y, m, d] = next?.split("-").map(Number) ?? [];
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onEdit(a)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-start transition-colors duration-150 hover:bg-hover"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{a.name}</span>
                        <span className="block truncate text-xs text-fg-muted">
                          {[a.provider, a.schedule?.length ? a.schedule.map((s) => `${WEEKDAYS_SHORT[s.weekday]} ${s.time}`).join(", ") : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-end">
                        <span className="block text-sm font-medium">
                          <Money value={a.cost} /> <span className="font-normal text-fg-muted">{FREQUENCY_LABEL[a.frequency]}</span>
                        </span>
                        {next && (
                          <span className="block text-xs text-fg-muted">
                            תשלום הבא {shortDate.format(new Date(y, m - 1, d))}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function ActivityForm({ activity, onDone }: { activity?: Activity; onDone: () => void }) {
  const activities = useAppStore((s) => s.activities);
  const addActivity = useAppStore((s) => s.addActivity);
  const updateActivity = useAppStore((s) => s.updateActivity);
  const deleteActivity = useAppStore((s) => s.deleteActivity);

  const [member, setMember] = useState(activity?.member ?? "");
  const [name, setName] = useState(activity?.name ?? "");
  const [provider, setProvider] = useState(activity?.provider ?? "");
  const [cost, setCost] = useState(activity ? amountToInput(activity.cost) : "");
  const [frequency, setFrequency] = useState<Activity["frequency"]>(activity?.frequency ?? "monthly");
  const [days, setDays] = useState<number[]>(activity?.schedule?.map((s) => s.weekday) ?? []);
  const [time, setTime] = useState(activity?.schedule?.[0]?.time ?? "17:00");
  const [error, setError] = useState<string | null>(null);

  const members = [...new Set(activities.map((a) => a.member))];

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!member.trim() || !name.trim()) return setError("נא למלא שם ילד/ה ושם חוג");
    const amount = parseAmount(cost);
    if (amount === null) return setError("נא להזין עלות תקינה");
    const input: ActivityInput = {
      member: member.trim(),
      name: name.trim(),
      provider: provider.trim() || undefined,
      cost: amount,
      frequency,
      schedule: [...days].sort().map((weekday) => ({ weekday, time })),
    };
    if (activity) updateActivity(activity.id, input);
    else addActivity(input);
    onDone();
  }

  function remove() {
    if (!activity) return;
    const before = snapshotData();
    deleteActivity(activity.id);
    onDone();
    toast("החוג נמחק, והתשלומים העתידיים שלו בוטלו", {
      duration: 5000,
      action: { label: "ביטול", onClick: () => useAppStore.getState().replaceData(before) },
    });
  }

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">ילד/ה</span>
          <input autoFocus={!activity} list="activity-members" value={member} onChange={(e) => setMember(e.target.value)} className={fieldClass} />
          <datalist id="activity-members">
            {members.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">חוג</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-fg-muted">ספק (לא חובה)</span>
        <input value={provider} onChange={(e) => setProvider(e.target.value)} className={fieldClass} />
      </label>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-fg-muted">עלות</span>
          <input dir="ltr" inputMode="decimal" placeholder="₪" value={cost} onChange={(e) => setCost(e.target.value)} className={`${fieldClass} text-end tabular-nums`} />
        </label>
        <Segmented label="תדירות תשלום" value={frequency} onChange={setFrequency} options={FREQUENCIES} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm text-fg-muted">ימים ושעה</legend>
        <div className="flex flex-wrap items-center gap-1.5">
          {WEEKDAYS_SHORT.map((label, d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(d)}
              onClick={() => toggleDay(d)}
              className={clsx(
                "pressable grid size-9 place-items-center rounded-full text-sm",
                days.includes(d) ? "bg-accent text-white" : "bg-hover text-fg-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
          <input type="time" aria-label="שעה" value={time} onChange={(e) => setTime(e.target.value)} className={`${fieldClass} ms-auto h-9 w-28`} />
        </div>
      </fieldset>
      <p className="text-xs text-fg-muted">התשלומים נרשמים ב-10 לחודש. סמסטר: ספטמבר ופברואר. שנתי: ספטמבר.</p>
      <p role="alert" className="min-h-5 text-sm text-negative">
        {error}
      </p>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="lg" className="flex-1">
          {activity ? "שמירה" : "הוספה"}
        </Button>
        {activity && (
          <Button variant="danger" size="lg" onClick={remove}>
            מחיקה
          </Button>
        )}
      </div>
    </form>
  );
}
