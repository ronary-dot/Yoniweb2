import type { AppData, Category, Mode, Workspace } from "./types";

export const DATA_VERSION = 2;

export const WORKSPACE_ID: Record<Mode, string> = {
  family: "ws-family",
  business: "ws-business",
};

const workspaces: Workspace[] = [
  { id: WORKSPACE_ID.family, mode: "family", name: "המשפחה שלי", currency: "ILS", cycleStartDay: 1 },
  { id: WORKSPACE_ID.business, mode: "business", name: "העסק שלי", currency: "ILS", cycleStartDay: 1 },
];

type CategorySeed = [id: string, name: string, icon: string, kind?: Category["kind"]];

const familyCategories: CategorySeed[] = [
  ["groceries", "סופר ומזון", "ShoppingCart"],
  ["housing", "דיור ושכירות", "House"],
  ["bills", "חשבונות", "Zap"],
  ["transport", "תחבורה ודלק", "Car"],
  ["kids", "ילדים וחינוך", "Baby"],
  ["activities", "חוגים", "Shapes"],
  ["health", "בריאות", "HeartPulse"],
  ["clothing", "ביגוד", "Shirt"],
  ["leisure", "בילויים ומסעדות", "UtensilsCrossed"],
  ["gifts", "מתנות", "Gift"],
  ["insurance", "ביטוחים", "Shield"],
  ["subscriptions", "מנויים", "Repeat"],
  ["misc", "שונות", "Ellipsis"],
  ["salary", "משכורת", "Wallet", "income"],
  ["business-draw", "משיכה מהעסק", "Briefcase", "income"],
  ["other-income", "הכנסה אחרת", "Plus", "income"],
];

const businessCategories: CategorySeed[] = [
  ["payroll", "שכר ופרילנסרים", "Users"],
  ["office", "שכירות משרד", "Building2"],
  ["software", "תוכנה ומנויים", "AppWindow"],
  ["marketing", "שיווק ופרסום", "Megaphone"],
  ["equipment", "ציוד", "Laptop"],
  ["accounting", "רו״ח ויעוץ", "Calculator"],
  ["travel", "נסיעות", "Plane"],
  ["insurance", "ביטוח", "Shield"],
  ["fees", "עמלות בנק וסליקה", "Landmark"],
  ["taxes", "מסים ואגרות", "Receipt"],
  ["owner-draw", "משיכת בעלים", "Wallet"],
  ["misc", "שונות", "Ellipsis"],
  ["client-revenue", "הכנסות מלקוחות", "Briefcase", "income"],
  ["other-income", "הכנסה אחרת", "Plus", "income"],
];

function toCategories(mode: Mode, seeds: CategorySeed[]): Category[] {
  return seeds.map(([id, name, icon, kind = "expense"]) => ({
    id: `${mode}-${id}`,
    workspaceId: WORKSPACE_ID[mode],
    name,
    icon,
    kind,
    archived: false,
  }));
}

export function createEmptyData(): AppData {
  return {
    version: DATA_VERSION,
    workspaces,
    categories: [
      ...toCategories("family", familyCategories),
      ...toCategories("business", businessCategories),
    ],
    transactions: [],
    recurring: [],
    goals: [],
    activities: [],
    shoppingLists: [],
    clients: [],
    invoices: [],
    isDemo: false,
  };
}
