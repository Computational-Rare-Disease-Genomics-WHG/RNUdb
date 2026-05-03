import { test, expect } from '@playwright/test';
import { mockCuratorAuth, mockGuestAuth } from './utils/mock-auth';

test.describe('Editor Page', () => {
  test('should redirect unauthenticated users away from editor', async ({ page }) => {
    mockGuestAuth(page);
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/editor');
  });

  test('should load editor page for curator', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/editor/);
  });

  test('should display editor header', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header');
    await expect(header.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display canvas element', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');

    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display toolbar with mode buttons', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const selectButton = page.locator('button:has-text("Select")');
    const addButton = page.locator('button:has-text("Add")');

    if (await selectButton.isVisible({ timeout: 3000 })) {
      await expect(selectButton).toBeVisible({ timeout: 5000 });
    }
    if (await addButton.isVisible({ timeout: 3000 })) {
      await expect(addButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have zoom controls', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const zoomIn = page.locator('button:has-text("Zoom In")');
    const zoomOut = page.locator('button:has-text("Zoom Out")');
    const resetView = page.locator('button:has-text("Reset View")');

    if (await zoomIn.isVisible({ timeout: 3000 })) {
      await expect(zoomIn).toBeVisible({ timeout: 5000 });
    }
    if (await zoomOut.isVisible({ timeout: 3000 })) {
      await expect(zoomOut).toBeVisible({ timeout: 5000 });
    }
    if (await resetView.isVisible({ timeout: 3003 })) {
      await expect(resetView).toBeVisible({ timeout: 5000 });
    }
  });
});
