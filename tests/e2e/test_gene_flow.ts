import { test, expect } from "@playwright/test";

test.describe("Gene Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("homepage loads successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/RNUdb/i);
  });

  test("can navigate to curate page", async ({ page }) => {
    await page.goto("/curate");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("can navigate to gene page", async ({ page }) => {
    await page.goto("/genes/RNU4-2");
    await expect(page.locator("h1")).toBeVisible();
  });
});
