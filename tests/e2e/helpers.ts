import { expect, type Page } from "@playwright/test";

/** The shell mirrors the active mode on <html> once it has hydrated. */
export async function waitForApp(page: Page, mode: "family" | "business") {
  await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;

/** Loads the demo through the shareable link and lands on the family dashboard. */
export async function loadDemo(page: Page) {
  await page.goto("/?demo=1");
  await page.waitForURL("**/family");
  await expect(page.getByText("מוצגים נתוני דמו.")).toBeVisible();
}

/** The persisted store, as the app wrote it. */
export async function storeState(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("yoniweb2") ?? "{}").state);
}

/** Opens the add-transaction sheet once no other sheet is still closing. */
export async function openNewTransaction(page: Page) {
  await expect(page.getByRole("dialog")).toHaveCount(0);
  if (isMobile(page)) await page.getByLabel("תנועה חדשה").click();
  else await page.getByRole("button", { name: /^תנועה חדשה/ }).first().click();
  await expect(page.getByRole("dialog", { name: "תנועה חדשה" })).toBeVisible();
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
}
