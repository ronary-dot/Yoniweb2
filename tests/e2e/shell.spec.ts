import { expect, test } from "@playwright/test";
import { isMobile, loadDemo, storeState, waitForApp } from "./helpers";

test("switching mode keeps the page type", async ({ page }) => {
  await loadDemo(page);
  await page.goto("/family/transactions");
  await waitForApp(page, "family");
  await page.getByRole("radio", { name: "עסק" }).filter({ visible: true }).click();
  await page.waitForURL("**/business/transactions");
  await expect(page.locator("[data-mode]").first()).toHaveAttribute("data-mode", "business");
});

test("a mode-only page switches to the other mode's dashboard", async ({ page }) => {
  await loadDemo(page);
  await page.goto("/business/clients");
  await waitForApp(page, "business");
  await page.keyboard.press("Control+.");
  await page.waitForURL(/\/family$/);
});

test("the command palette navigates and quick-adds", async ({ page }) => {
  test.skip(isMobile(page), "keyboard shortcut");
  await loadDemo(page);
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "חיפוש ופקודות" });
  await expect(palette).toBeVisible();
  await page.keyboard.type("הוצאה 42 סופר");
  await expect(palette.getByText("סופר ומזון")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(palette).toBeHidden();
  const added = (await storeState(page)).transactions.find((t: { amount: number; categoryId: string }) => t.amount === 4200 && t.categoryId === "family-groceries");
  expect(added).toBeTruthy();

  await page.keyboard.press("Control+k");
  await page.keyboard.type("דוחות");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/family/reports");
});

test("dark mode can be chosen in settings", async ({ page }) => {
  await loadDemo(page);
  await page.goto("/settings");
  await page.getByRole("radio", { name: "כהה" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("radio", { name: "בהיר" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
