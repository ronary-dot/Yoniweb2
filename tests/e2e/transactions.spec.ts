import { expect, test } from "@playwright/test";
import { isMobile, openNewTransaction, storeState } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "התחל עם אפליקציה ריקה" }).click();
  await page.waitForURL("**/family");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("הבית");
});

test("add, validate, edit and delete with undo", async ({ page }) => {
  await openNewTransaction(page);
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "הוספה" }).click();
  await expect(sheet.getByRole("alert")).toHaveText("נא להזין סכום תקין");

  await sheet.locator("input[inputmode=decimal]").fill("1,234.5");
  await sheet.getByRole("radio", { name: "סופר ומזון" }).click();
  await sheet.getByPlaceholder("לא חובה").fill("שופרסל");
  await sheet.getByRole("button", { name: "הוספה" }).click();
  await expect(sheet).toBeHidden();
  expect((await storeState(page)).transactions[0]).toMatchObject({ amount: 123450, categoryId: "family-groceries", note: "שופרסל" });

  await page.goto("/family/transactions");
  await page.getByRole("button", { name: /סופר ומזון/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "מחיקה" }).click();
  await expect(page.getByText("אין עדיין תנועות")).toBeVisible();
  await page.getByRole("button", { name: "ביטול" }).click();
  await expect(page.getByRole("button", { name: /סופר ומזון/ })).toBeVisible();
});

test("N opens a new transaction", async ({ page }) => {
  test.skip(isMobile(page), "keyboard shortcut");
  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("n");
  await expect(page.getByRole("dialog", { name: "תנועה חדשה" })).toBeVisible();
});

test("budgets turn red when exceeded", async ({ page }) => {
  await page.goto("/family/budgets");
  await page.getByRole("button", { name: /בילויים ומסעדות/ }).click();
  await page.getByRole("dialog").getByPlaceholder("₪").fill("100");
  await page.getByRole("dialog").getByRole("button", { name: "שמירה" }).click();
  await openNewTransaction(page);
  const sheet = page.getByRole("dialog");
  await sheet.locator("input[inputmode=decimal]").fill("150");
  await sheet.getByRole("radio", { name: "בילויים ומסעדות" }).click();
  await sheet.getByRole("button", { name: "הוספה" }).click();
  await expect(page.getByRole("button", { name: /בילויים ומסעדות/ }).locator(".text-negative")).toBeVisible();
});
