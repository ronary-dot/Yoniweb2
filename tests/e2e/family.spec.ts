import { expect, test } from "@playwright/test";
import { loadDemo, storeState } from "./helpers";

test.beforeEach(async ({ page }) => loadDemo(page));

test("the dashboard surfaces the leisure overrun", async ({ page }) => {
  await expect(page.getByText(/חרגתם מהתקציב של בילויים ומסעדות/)).toBeVisible();
});

test("reaching a goal celebrates once", async ({ page }) => {
  await page.goto("/family/goals");
  const card = page.locator("div.rounded-2xl", { hasText: "חופשה ביוון" });
  await card.getByRole("button", { name: "הפקדה" }).click();
  await page.getByRole("dialog").locator("input[inputmode=decimal]").fill("7000");
  await page.getByRole("dialog").getByRole("button", { name: "הפקדה" }).last().click();
  await expect(page.getByText('הגעתם ליעד "חופשה ביוון"! 🎉')).toBeVisible();
  await expect(card.getByText("הושג")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0, { timeout: 3000 });
});

test("an activity schedules, re-prices and cancels its fees", async ({ page }) => {
  await page.goto("/family/activities");
  await page.getByRole("button", { name: "חוג חדש" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("ילד/ה").fill("איתי");
  await sheet.getByLabel("חוג", { exact: true }).fill("שחייה");
  await sheet.locator("input[inputmode=decimal]").fill("350");
  await sheet.getByRole("button", { name: "הוספה" }).click();

  const fees = async () => {
    const s = await storeState(page);
    const swim = s.activities.find((a: { name: string }) => a.name === "שחייה");
    return swim ? s.transactions.filter((t: { activityId?: string }) => t.activityId === swim.id) : [];
  };
  expect((await fees()).length).toBeGreaterThanOrEqual(3);

  await page.getByRole("button", { name: /שחייה/ }).click();
  await page.getByRole("dialog").locator("input[inputmode=decimal]").fill("390");
  await page.getByRole("dialog").getByRole("button", { name: "שמירה" }).click();
  expect(new Set((await fees()).map((t: { amount: number }) => t.amount))).toEqual(new Set([39000]));

  await page.getByRole("button", { name: /שחייה/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "מחיקה" }).click();
  expect(await fees()).toHaveLength(0);
});

test("shopping checkout records a grocery expense", async ({ page }) => {
  await page.goto("/family/shopping");
  await page.getByPlaceholder("הוסיפו פריט ולחצו Enter").fill("קפה");
  await page.keyboard.press("Enter");
  await page.getByRole("checkbox", { name: /קפה/ }).click();
  await page.getByRole("button", { name: /סיום קנייה/ }).click();
  await page.getByRole("dialog").getByLabel("סכום").fill("245");
  await page.getByRole("dialog").getByRole("button", { name: "רישום הקנייה" }).click();
  const s = await storeState(page);
  expect(s.transactions.some((t: { amount: number; categoryId: string }) => t.amount === 24500 && t.categoryId === "family-groceries")).toBe(true);
  expect(s.shoppingLists[0].items.some((i: { label: string }) => i.label === "קפה")).toBe(false);
});
