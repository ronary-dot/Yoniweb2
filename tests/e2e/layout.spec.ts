import { test } from "@playwright/test";
import { expectNoHorizontalOverflow, loadDemo } from "./helpers";

const PAGES = [
  "/family",
  "/family/transactions",
  "/family/budgets",
  "/family/goals",
  "/family/activities",
  "/family/shopping",
  "/family/reports",
  "/business",
  "/business/transactions",
  "/business/clients",
  "/business/cashflow",
  "/business/reports",
  "/settings",
];

// break-ui: worst-case names and amounts must not push any screen sideways.
test("no screen overflows with worst-case data", async ({ page }) => {
  await loadDemo(page);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("yoniweb2")!);
    const s = raw.state;
    const iso = new Date().toISOString().slice(0, 10);
    s.categories.find((c: { id: string }) => c.id === "family-leisure").name = "בילויים, מסעדות, בתי קפה וארוחות משפחתיות בסופי שבוע";
    s.transactions.push({ id: "huge", workspaceId: "ws-family", kind: "expense", amount: 1234567890, categoryId: "family-leisure", date: iso, status: "actual", note: "bartholomew.fitzgerald@northwind-industries-holdings.example.com", createdAt: new Date().toISOString() });
    s.clients[0].name = "Konstantin Oberhauser-Wettstein Holdings International Ltd.";
    s.goals[0].name = "חופשה משפחתית ארוכה ביוון, כולל השכרת רכב ולינה בכל האיים";
    s.goals[0].target = 999999999;
    s.activities[0].name = "כדורסל תחרותי – נבחרת הנוער של מועדון הפועל תל אביב";
    s.shoppingLists[0].name = "סופר שבועי גדול לפני החגים והאירוח של כל המשפחה";
    localStorage.setItem("yoniweb2", JSON.stringify(raw));
  });
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page);
  }
});
