import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public routes render and retain the main landmark", async ({ page }) => {
  for (const [path, heading] of [["/", "Recent Sermons"], ["/about", "About"], ["/events", "Events"], ["/gallery", "Gallery"], ["/connect", "Get Connected"]]) {
    await page.goto(path);
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.getByRole("heading", { name: new RegExp(heading, "i") }).first()).toBeVisible();
  }
});

test("mobile navigation opens and closes accessibly without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("home and contact pages have no serious automated accessibility violations", async ({ page }) => {
  for (const path of ["/", "/connect"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.filter(({ impact }) => ["critical", "serious"].includes(impact))).toEqual([]);
  }
});
