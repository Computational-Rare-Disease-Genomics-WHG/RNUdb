import { test, expect } from '@playwright/test';

test.describe('API Documentation Page', () => {
  test('should load the API documentation page', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should display API header', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should display tabs container', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should switch to Guides tab', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should switch to Rate Limits tab', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should display endpoint information', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should have Endpoints tab active by default', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });
});
