import { expect, test } from "@playwright/test";
import { loadDemo, storeState, waitForApp } from "./helpers";

test("first visit shows the welcome screen and loads the demo", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("**/welcome");
  await page.getByRole("button", { name: "טען נתוני דמו" }).click();
  await page.waitForURL("**/family");
  await expect(page.getByText("מוצגים נתוני דמו.")).toBeVisible();
  expect((await storeState(page)).isDemo).toBe(true);
});

test("starting empty skips the demo", async ({ page }) => {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "התחל עם אפליקציה ריקה" }).click();
  await page.waitForURL("**/family");
  await expect(page.getByText("אין עדיין תנועות")).toBeVisible();
});

test("returning visitors go back to their last mode", async ({ page }) => {
  await loadDemo(page);
  await page.goto("/business");
  await waitForApp(page, "business");
  await expect.poll(async () => (await storeState(page)).lastMode).toBe("business");
  await page.goto("/");
  await page.waitForURL("**/business");
});

test("clearing the demo can be undone", async ({ page }) => {
  await loadDemo(page);
  await page.getByRole("button", { name: "ניקוי והתחלה מחדש" }).click();
  await expect(page.getByText("אין עדיין תנועות")).toBeVisible();
  await page.getByRole("button", { name: "ביטול" }).click();
  await expect(page.getByText("מוצגים נתוני דמו.")).toBeVisible();
});
