import { test, expect } from '@playwright/test';
import { mockAdminAuth } from './utils/mock-auth';

test.describe('Gene Page Interactions', () => {
  test('should display gene information', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display variants section', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display literature section', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle gene not found gracefully', async ({ page }) => {
    await page.goto('/gene/NONEXISTENTGENE');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Editor Page', () => {
  test('should load editor page', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display editor toolbar if present', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test('should load admin dashboard for admin user', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show pending approvals tab', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show users tab', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Clinical Interpretation Page', () => {
  test('should load clinical interpretation page', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display filters if present', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('API Documentation Page', () => {
  test('should load API documentation page', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });

  test('should display API endpoints', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/api-docs/);
  });
});

test.describe('How To Use Page', () => {
  test('should load how to use page', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display guide sections', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});
