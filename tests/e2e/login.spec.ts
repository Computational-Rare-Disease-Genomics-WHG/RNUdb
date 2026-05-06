import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display login page content', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('main, [role="main"], body > div');
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have a header visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header');
    await expect(header.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have a footer visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const footer = page.locator('footer');
    await expect(footer.first()).toBeVisible({ timeout: 5000 });
  });
});
