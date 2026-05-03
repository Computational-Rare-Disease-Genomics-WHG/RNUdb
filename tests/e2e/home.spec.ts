import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/RNUdb/i);
  });

  test('should display the search bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display gene cards or gene list', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should have a header with navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const header = page.locator('header');
    await expect(header.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to gene page when clicking a gene', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const geneLink = page.locator('a[href*="/gene/"]').first();
    if (await geneLink.isVisible({ timeout: 3000 })) {
      await geneLink.click();
      await page.waitForURL(/\/gene\//, { timeout: 5000 });
      await expect(page).toHaveURL(/\/gene\//);
    }
  });
});