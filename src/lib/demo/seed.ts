// Demo data — SPEC §8. Deterministic for a given day: a fixed PRNG seed, with
// every date placed relative to `today` so the demo always looks current.

import { createEmptyData, WORKSPACE_ID } from "@/lib/defaults";
import { cycleFor } from "@/lib/domain/period";
import { toISODate } from "@/lib/format";
import type {
  Activity,
  AppData,
  Client,
  Goal,
  Invoice,
  Money,
  PaymentMethod,
  ShoppingList,
  Transaction,
} from "@/lib/types";

/** mulberry32 — tiny, fast, good enough for fake data. */
export function createRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    /** Whole shekels in [min, max], as agorot. */
    shekels: (min: number, max: number) => (Math.floor(next() * (max - min + 1)) + min) * 100,
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
  };
}

const SEED = 20261024;
const MONTHS_BACK = 6;
const MONTHS_AHEAD = 3;

export const DEMO_FAMILY_NAME = "משפחת כהן";
export const DEMO_BUSINESS_NAME = "סטודיו יוני";
/** Business cash floor; the forecast is built to approach it (SPEC §8.2). */
export const DEMO_SAFETY_THRESHOLD: Money = 20_000_00;
/** Days ahead at which the forecast comes closest to the threshold. */
export const DEMO_LOW_POINT_DAYS = 48;
const DEMO_LOW_POINT_MARGIN: Money = 3_500_00;

export function createDemoData(today: Date): AppData {
  const rand = createRandom(SEED);
  const data = createEmptyData();
  const todayISO = toISODate(today);
  let counter = 0;
  const id = (prefix: string) => `demo-${prefix}-${++counter}`;

  const day = (offsetDays: number) =>
    toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays));
  /** A date in the month `monthOffset` from today's, clamped to that month's length. */
  const inMonth = (monthOffset: number, dayOfMonth: number) => {
    const last = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0).getDate();
    return toISODate(new Date(today.getFullYear(), today.getMonth() + monthOffset, Math.min(dayOfMonth, last)));
  };
  const statusFor = (date: string): Transaction["status"] => (date <= todayISO ? "actual" : "expected");

  const transactions: Transaction[] = [];
  function add(
    mode: "family" | "business",
    kind: Transaction["kind"],
    category: string,
    amount: Money,
    date: string,
    extra: Partial<Transaction> = {},
  ): Transaction {
    const transaction: Transaction = {
      id: id("tx"),
      workspaceId: WORKSPACE_ID[mode],
      kind,
      amount,
      categoryId: `${mode}-${category}`,
      date,
      status: statusFor(date),
      createdAt: `${date}T${String(8 + (counter % 12)).padStart(2, "0")}:00:00.000Z`,
      ...extra,
    };
    transactions.push(transaction);
    return transaction;
  }
  /** Adds a transaction only if the date has already happened. */
  const addPast = (...args: Parameters<typeof add>) => (args[4] <= todayISO ? add(...args) : undefined);

  // ---------------------------------------------------------------- family
  data.workspaces = data.workspaces.map((w) =>
    w.mode === "family"
      ? { ...w, name: DEMO_FAMILY_NAME }
      : { ...w, name: DEMO_BUSINESS_NAME, safetyThreshold: DEMO_SAFETY_THRESHOLD },
  );

  const familyBudgets: Record<string, Money> = {
    groceries: 4_200_00,
    housing: 6_200_00,
    bills: 1_400_00,
    transport: 900_00,
    activities: 1_300_00,
    leisure: 800_00,
    clothing: 600_00,
    subscriptions: 300_00,
  };
  data.categories = data.categories.map((c) => {
    const key = c.id.replace(/^family-/, "");
    return c.workspaceId === WORKSPACE_ID.family && familyBudgets[key]
      ? { ...c, monthlyBudget: familyBudgets[key] }
      : c;
  });

  const card: { paymentMethod: PaymentMethod } = { paymentMethod: "card" };
  const standing: { paymentMethod: PaymentMethod } = { paymentMethod: "standing_order" };
  const supermarkets = ["שופרסל", "רמי לוי", "יוחננוף", "ויקטורי"];
  const outings = ["פיצה", "סושי", "קולנוע", "גלידה", "ארוחת שישי", "בית קפה"];

  for (let m = -MONTHS_BACK; m <= MONTHS_AHEAD; m++) {
    // Income and fixed costs happen every month; future ones are "expected".
    add("family", "income", "salary", 14_500_00, inMonth(m, 1), { note: "משכורת – אבי", paymentMethod: "transfer" });
    add("family", "income", "salary", 11_200_00, inMonth(m, 1), { note: "משכורת – מיכל", paymentMethod: "transfer" });
    add("family", "expense", "housing", 6_200_00, inMonth(m, 1), { note: "שכירות", ...standing });
    add("family", "expense", "bills", 620_00, inMonth(m, 5), { note: "ארנונה", ...standing });
    add("family", "expense", "subscriptions", 199_00, inMonth(m, 8), { note: "אינטרנט וסלולר", ...standing });
    add("family", "expense", "subscriptions", 55_00, inMonth(m, 12), { note: "נטפליקס", ...card });
    add("family", "expense", "insurance", 380_00, inMonth(m, 15), { note: "ביטוח בריאות ורכב", ...standing });
    if (m % 2 === 0) add("family", "expense", "bills", rand.shekels(380, 560), inMonth(m, 18), { note: "חשמל", ...standing });
    if (m % 2 !== 0) add("family", "expense", "bills", rand.shekels(150, 220), inMonth(m, 18), { note: "מים", ...standing });

    // Variable spending only exists in the past.
    for (let week = 0; week < 5; week++) {
      addPast("family", "expense", "groceries", rand.shekels(600, 1_100), inMonth(m, 2 + week * 7 + rand.int(0, 2)), {
        note: rand.pick(supermarkets),
        ...card,
      });
    }
    for (let i = 0; i < 2; i++) {
      addPast("family", "expense", "transport", rand.shekels(300, 420), inMonth(m, 6 + i * 13), { note: "דלק", ...card });
    }
    for (let i = 0; i < 4; i++) {
      addPast("family", "expense", "leisure", rand.shekels(110, 260), inMonth(m, 4 + i * 7 + rand.int(0, 3)), {
        note: rand.pick(outings),
        paymentMethod: rand.pick(["card", "app"] as const),
      });
    }
    addPast("family", "expense", "kids", rand.shekels(80, 260), inMonth(m, 9), { note: "ציוד לבית הספר", ...card });
    addPast("family", "expense", "health", rand.shekels(40, 180), inMonth(m, 21), { note: "בית מרקחת", ...card });
    if (rand.next() < 0.6) {
      addPast("family", "expense", "clothing", rand.shekels(150, 520), inMonth(m, 23), { note: "בגדים לילדים", ...card });
    }
    if (rand.next() < 0.4) {
      addPast("family", "expense", "gifts", rand.shekels(100, 300), inMonth(m, 26), { note: "מתנת יום הולדת", paymentMethod: "app" });
    }
  }

  // The deliberate overrun (SPEC §8.2): a big night out on the first day of
  // the current cycle puts leisure over budget whatever today's date is.
  const currentCycle = cycleFor(today, 1);
  add("family", "expense", "leisure", 960_00, currentCycle.start, { note: "ארוחת יום נישואין", ...card });

  // Activities, each generating its payments (SPEC §5.3).
  const activities: Activity[] = [
    { id: id("act"), member: "איתי", name: "כדורסל", provider: "מועדון הפועל", cost: 280_00, frequency: "monthly", schedule: [{ weekday: 1, time: "17:00" }, { weekday: 3, time: "17:00" }] },
    { id: id("act"), member: "נועה", name: "פסנתר", provider: "הקונסרבטוריון", cost: 420_00, frequency: "monthly", schedule: [{ weekday: 2, time: "16:30" }] },
    { id: id("act"), member: "מאיה", name: "התעמלות", provider: "מתנ״ס השכונה", cost: 1_500_00, frequency: "semester", schedule: [{ weekday: 4, time: "16:00" }] },
  ];
  data.activities = activities;
  for (let m = -MONTHS_BACK; m <= MONTHS_AHEAD; m++) {
    for (const a of activities) {
      const month = new Date(today.getFullYear(), today.getMonth() + m, 1).getMonth();
      const due = a.frequency === "monthly" || (a.frequency === "semester" && (month === 8 || month === 1));
      if (due) {
        add("family", "expense", "activities", a.cost, inMonth(m, 10), {
          note: `${a.name} – ${a.member}`,
          activityId: a.id,
          ...card,
        });
      }
    }
  }

  data.shoppingLists = [
    {
      id: id("list"),
      name: "סופר שבועי",
      items: [
        ["חלב", "3", true],
        ["לחם", "2", true],
        ["ביצים", "תבנית", false],
        ["עגבניות", "1 ק״ג", false],
        ["מלפפונים", "1 ק״ג", false],
        ["גבינה צהובה", "", false],
        ["אורז", "", true],
        ["במבה", "4", false],
      ].map(([label, qty, done]) => ({ id: id("item"), label: label as string, qty: (qty as string) || undefined, done: done as boolean })),
    },
    {
      id: id("list"),
      name: "פארם",
      items: [
        ["משחת שיניים", "", false],
        ["קרם הגנה", "", false],
        ["ויטמין D", "", true],
      ].map(([label, qty, done]) => ({ id: id("item"), label: label as string, qty: (qty as string) || undefined, done: done as boolean })),
    },
  ] satisfies ShoppingList[];

  /** Monthly contributions summing to `total`, ending this month. */
  const contributions = (total: Money, months: number) =>
    Array.from({ length: months }, (_, i) => ({
      date: inMonth(i - months + 1, 3),
      amount: Math.round(total / months),
    }));

  const goals: Goal[] = [
    { id: id("goal"), workspaceId: WORKSPACE_ID.family, name: "חופשה ביוון", emoji: "🏝️", target: 18_000_00, deadline: inMonth(8, 1), type: "saving", contributions: contributions(11_160_00, 6) },
    { id: id("goal"), workspaceId: WORKSPACE_ID.family, name: "קרן חירום", emoji: "🛟", target: 30_000_00, type: "saving", contributions: contributions(12_300_00, 6) },
    { id: id("goal"), workspaceId: WORKSPACE_ID.family, name: "מחשב לנועה", emoji: "💻", target: 4_500_00, deadline: inMonth(-1, 15), type: "saving", contributions: contributions(4_500_00, 5) },
  ];

  // -------------------------------------------------------------- business
  // Opening balance six months ago, so the running cash balance is realistic.
  add("business", "income", "other-income", 70_000_00, inMonth(-MONTHS_BACK, 1), { note: "יתרת פתיחה" });

  const clients: Client[] = [
    { id: id("client"), name: "קפה נחת", contact: "דנה", paymentTermsDays: 30 },
    { id: id("client"), name: "גלבוע אדריכלים", contact: "רון גלבוע", paymentTermsDays: 30 },
    { id: id("client"), name: "מרפאת שן טובה", contact: "ד״ר לוי", paymentTermsDays: 45 },
    { id: id("client"), name: "אורבן-גו", contact: "שירה", paymentTermsDays: 60 },
    { id: id("client"), name: "יוגה בית", contact: "טל", paymentTermsDays: 30 },
    { id: id("client"), name: "הוצאת מילים", contact: "אורי", paymentTermsDays: 30 },
  ];
  data.clients = clients;

  // [client index, issued (days from today), amount in shekels]. Due date
  // follows the client's terms; past-due ones are paid unless listed overdue.
  const invoicePlan: [number, number, number][] = [
    [0, -175, 6_500], [1, -160, 18_000], [2, -140, 9_800], [3, -125, 24_000],
    [4, -110, 4_200], [1, -95, 12_500], [2, -80, 7_900], [3, -70, 28_000],
    [0, -55, 5_400], [2, -45, 11_000], [4, -38, 4_800], [1, -25, 16_500],
    [3, -12, 21_000], [5, -6, 8_600],
    // Planned work: drafts not yet issued, due over the next three months.
    [1, -2, 14_000], [3, 8, 26_000], [4, 22, 9_000], [0, 30, 6_500], [5, 34, 12_500], [1, 52, 18_000],
  ];
  const OVERDUE_CLIENT = 2; // מרפאת שן טובה — the 35-days-late account
  const invoices: Invoice[] = invoicePlan.map(([clientIndex, issuedOffset, shekels], i) => {
    const client = clients[clientIndex];
    const issuedAt = day(issuedOffset);
    const dueOffset = issuedOffset + client.paymentTermsDays;
    const invoice: Invoice = {
      id: id("inv"),
      clientId: client.id,
      number: String(1041 + i),
      amount: shekels * 100,
      vat: true,
      issuedAt,
      dueAt: day(dueOffset),
      payments: [],
      status: issuedOffset > 0 ? "draft" : "sent",
    };
    const overdue = clientIndex === OVERDUE_CLIENT && dueOffset === -35;
    if (dueOffset <= 0 && !overdue) {
      // Paid a few days around the due date.
      const paidAt = day(Math.min(0, dueOffset + rand.int(-3, 6)));
      invoice.payments = [{ date: paidAt, amount: invoice.amount }];
      invoice.status = "paid";
      add("business", "income", "client-revenue", invoice.amount, paidAt, {
        note: `${client.name} · חשבונית ${invoice.number}`,
        invoiceId: invoice.id,
        paymentMethod: "transfer",
      });
    } else if (dueOffset > 0) {
      add("business", "income", "client-revenue", invoice.amount, invoice.dueAt, {
        note: `${client.name} · חשבונית ${invoice.number}`,
        invoiceId: invoice.id,
        paymentMethod: "transfer",
      });
    }
    return invoice;
  });
  data.invoices = invoices;

  for (let m = -MONTHS_BACK; m <= MONTHS_AHEAD; m++) {
    add("business", "expense", "office", 2_400_00, inMonth(m, 1), { note: "חלל עבודה משותף", ...standing });
    add("business", "expense", "payroll", 5_500_00, inMonth(m, 9), { note: "פרילנסר פיתוח", paymentMethod: "transfer" });
    add("business", "expense", "software", 180_00, inMonth(m, 3), { note: "Figma", ...card });
    add("business", "expense", "software", 75_00, inMonth(m, 3), { note: "Vercel", ...card });
    add("business", "expense", "software", 110_00, inMonth(m, 4), { note: "Google Workspace", ...card });
    add("business", "expense", "accounting", 850_00, inMonth(m, 12), { note: "רואה חשבון", paymentMethod: "transfer" });
    add("business", "expense", "insurance", 290_00, inMonth(m, 15), { note: "ביטוח אחריות מקצועית", ...standing });
    addPast("business", "expense", "fees", rand.shekels(30, 65), inMonth(m, 28), { note: "עמלות בנק" });
    if (rand.next() < 0.5) {
      addPast("business", "expense", "marketing", rand.shekels(400, 1_800), inMonth(m, 20), { note: "קמפיין ממומן", ...card });
    }

    // Owner's draw: one linked pair, expense in the business and income at home.
    const drawDate = inMonth(m, 2);
    const out = add("business", "expense", "owner-draw", 10_000_00, drawDate, { note: "משיכה חודשית", paymentMethod: "transfer" });
    const into = add("family", "income", "business-draw", 10_000_00, drawDate, { note: "מהסטודיו", paymentMethod: "transfer" });
    out.linkedTransactionId = into.id;
    into.linkedTransactionId = out.id;
  }
  addPast("business", "expense", "equipment", 7_400_00, day(-130), { note: "מחשב נייד חדש", ...card });

  // Shape the forecast so it dips close to the safety threshold ~7 weeks out:
  // a VAT payment on that day, sized so the lowest projected balance from
  // then until the end of the 90-day horizon sits just above the threshold.
  const lowPoint = day(DEMO_LOW_POINT_DAYS);
  const horizon = day(90);
  const business = transactions
    .filter((t) => t.workspaceId === WORKSPACE_ID.business && t.date <= horizon)
    .sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  let lowest = Infinity;
  for (const t of business) {
    running += t.kind === "income" ? t.amount : -t.amount;
    if (t.date >= lowPoint) lowest = Math.min(lowest, running);
  }
  const vat = Math.max(0, lowest - DEMO_SAFETY_THRESHOLD - DEMO_LOW_POINT_MARGIN);
  add("business", "expense", "taxes", Math.floor(vat / 100_00) * 100_00, lowPoint, {
    note: "תשלום מע״מ דו-חודשי",
    paymentMethod: "transfer",
  });

  goals.push(
    { id: id("goal"), workspaceId: WORKSPACE_ID.business, name: "יעד הכנסות חודשי", target: 30_000_00, type: "revenue", contributions: [] },
    { id: id("goal"), workspaceId: WORKSPACE_ID.business, name: "רזרבת ביטחון (3 חודשים)", target: 31_000_00, type: "reserve", contributions: contributions(17_000_00, 6) },
  );
  data.goals = goals;

  data.transactions = transactions;
  data.isDemo = true;
  return data;
}
