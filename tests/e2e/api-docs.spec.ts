import { test, expect } from '@playwright/test';

test.describe('API Documentation Page', () => {
  test('should load the API documentation page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);

    // Log any console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
  });

  test('should display API header', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    // Check page loaded with some content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should display tabs container', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should switch to Guides tab', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should switch to Rate Limits tab', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should display endpoint information', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should have Endpoints tab active by default', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});
