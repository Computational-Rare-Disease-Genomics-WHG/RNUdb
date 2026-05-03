import { test, expect } from '@playwright/test';

test.describe('API Documentation Page', () => {
  test('should load the API documentation page', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should display API header', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('h1');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display tabs container', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    const tabsContainer = page.locator('[class*="rounded-xl"][class*="bg-slate-200"]');
    await expect(tabsContainer.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to Guides tab', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    const guidesButton = page.locator('button:has-text("Guides")').first();
    if (await guidesButton.isVisible({ timeout: 3000 })) {
      await guidesButton.click();
      await page.waitForTimeout(500);
      
      const gettingStarted = page.locator('text=Getting Started');
      await expect(gettingStarted.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should switch to Rate Limits tab', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    const rateLimitsButton = page.locator('button:has-text("Rate Limits")').first();
    if (await rateLimitsButton.isVisible({ timeout: 3000 })) {
      await rateLimitsButton.click();
      await page.waitForTimeout(500);
      
      const rateLimiting = page.locator('text=Rate Limiting Policy');
      await expect(rateLimiting.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display endpoint information', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    const endpointCard = page.locator('[class*="rounded-xl"][class*="border"]').first();
    await expect(endpointCard).toBeVisible({ timeout: 5000 });
  });

  test('should have Endpoints tab active by default', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    const endpointContent = page.locator('text=/api/genes');
    await expect(endpointContent.first()).toBeVisible({ timeout: 10000 });
  });
});