import { expect, test } from "@playwright/test";
import { loadDemo, storeState } from "./helpers";

test.beforeEach(async ({ page }) => loadDemo(page));

test("the forecast warns near the threshold and reacts to what-if", async ({ page }) => {
  await page.goto("/business/cashflow");
  await expect(page.getByRole("status").filter({ hasText: "התחזית מתקרבת" })).toBeVisible();
  await page.locator("li", { hasText: "אורבן-גו" }).first().getByRole("button", { name: "מה אם נדחה?" }).click();
  await expect(page.getByRole("status").filter({ hasText: "התחזית יורדת מתחת" })).toBeVisible();
});

test("marking the late invoice paid clears the overdue balance", async ({ page }) => {
  await page.goto("/business/clients");
  await page.getByRole("radio", { name: "חשבוניות" }).click();
  await page.getByRole("button", { name: /באיחור 35 ימים/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "סימון כשולם" }).click();
  await expect(page.getByText("החשבונית סומנה כשולמה, וההכנסה נרשמה")).toBeVisible();
  await expect(page.getByRole("button", { name: /באיחור/ })).toHaveCount(0);
});

test("a partial payment splits actual and expected income", async ({ page }) => {
  await page.goto("/business/clients");
  await page.getByRole("button", { name: "לקוח", exact: true }).click();
  await page.getByRole("dialog").getByLabel("שם הלקוח").fill("מאפיית השכונה");
  await page.getByRole("dialog").getByRole("button", { name: "הוספת לקוח" }).click();
  await page.getByRole("button", { name: "חשבונית", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("לקוח").selectOption({ label: "מאפיית השכונה" });
  await sheet.locator("input[inputmode=decimal]").fill("5000");
  await sheet.getByRole("button", { name: "יצירת חשבונית" }).click();

  await page.getByRole("radio", { name: "חשבוניות" }).click();
  await page.getByRole("button", { name: /מאפיית השכונה/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "תשלום חלקי" }).click();
  await page.getByRole("dialog").getByLabel("התקבל").fill("2000");
  await page.getByRole("dialog").getByRole("button", { name: "רישום תשלום" }).click();

  const s = await storeState(page);
  const invoice = s.invoices.find((i: { amount: number; status: string }) => i.amount === 500000);
  const split = s.transactions
    .filter((t: { invoiceId?: string }) => t.invoiceId === invoice.id)
    .map((t: { status: string; amount: number }) => `${t.status}:${t.amount}`)
    .sort();
  expect(invoice.status).toBe("partial");
  expect(split).toEqual(["actual:200000", "expected:300000"]);
});
