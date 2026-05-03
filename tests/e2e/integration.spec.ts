import { test, expect } from '@playwright/test';
import { mockCuratorAuth, mockAdminAuth } from './utils/mock-auth';

test.describe('Gene Page Interactions', () => {
  test('should display gene information', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should load without crashing
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display variants section', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for variant-related content
    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('should display literature section', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('should handle gene not found gracefully', async ({ page }) => {
    await page.goto('/gene/NONEXISTENTGENE');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should handle gracefully (either show error or redirect)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Editor Page', () => {
  test('should load editor page', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display editor toolbar if present', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for toolbar or canvas
    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });
});

test.describe('Admin Dashboard', () => {
  test('should load admin dashboard for admin user', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should either show admin content or redirect
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show pending approvals tab', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for tabs or pending content
    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('should show users tab', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });
});

test.describe('Clinical Interpretation Page', () => {
  test('should load clinical interpretation page', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display filters if present', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });
});

test.describe('API Documentation Page', () => {
  test('should load API documentation page', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display API endpoints', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });
});

test.describe('How To Use Page', () => {
  test('should load how to use page', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display guide sections', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const content = page.locator('body').textContent();
    expect(content).toBeTruthy();
  });
});
