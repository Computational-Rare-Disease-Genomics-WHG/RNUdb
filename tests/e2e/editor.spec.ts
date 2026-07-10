import { test, expect } from '@playwright/test';
import { mockCuratorAuth, mockGuestAuth } from './utils/mock-auth';

test.describe('Editor Page', () => {

  test.describe('Auth & Loading', () => {
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
      await expect(page.locator('header').first()).toBeVisible({ timeout: 5000 });
    });

    test('should display SVG element', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('svg').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display empty state message', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText('Start Creating')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Toolbar', () => {
    test('should have all mode buttons', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('button:has(svg.lucide-mouse-pointer-2)')).toBeVisible();
      await expect(page.locator('button:has(svg.lucide-move)')).toBeVisible();
      await expect(page.locator('button:has(svg.lucide-plus)')).toBeVisible();
      await expect(page.locator('button:has(svg.lucide-link)')).toBeVisible();
      await expect(page.locator('button:has(svg.lucide-type)')).toBeVisible();
      await expect(page.locator('button:has(svg.lucide-shapes)')).toBeVisible();
    });

    test('should switch modes when clicking tool buttons', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');

      const addButton = page.locator('button:has(svg.lucide-plus)');
      await addButton.click();
      await expect(addButton).toHaveClass(/bg-teal-600/);

      const panButton = page.locator('button:has(svg.lucide-move)');
      await panButton.click();
      await expect(panButton).toHaveClass(/bg-teal-600/);

      const pairButton = page.locator('button:has(svg.lucide-link)');
      await pairButton.click();
      await expect(pairButton).toHaveClass(/bg-teal-600/);

      const selectButton = page.locator('button:has(svg.lucide-mouse-pointer-2)');
      await selectButton.click();
      await expect(selectButton).toHaveClass(/bg-teal-600/);
    });
  });

  test.describe('Zoom Controls', () => {
    test('should display zoom percentage', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText('100%')).toBeVisible();
    });

    test('should zoom in', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('button:has(svg.lucide-zoom-in)').click();
      await expect(page.getByText('125%')).toBeVisible();
    });

    test('should zoom out', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('button:has(svg.lucide-zoom-out)').click();
      await expect(page.getByText('75%')).toBeVisible();
    });

    test('should reset view', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('button:has(svg.lucide-zoom-in)').click();
      await page.locator('button:has(svg.lucide-zoom-in)').click();
      await expect(page.getByText('150%')).toBeVisible();
      await page.locator('button:has(svg.lucide-rotate-ccw)').click();
      await expect(page.getByText('100%')).toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts Overlay', () => {
    test('should toggle shortcuts overlay and show multi-select shortcuts', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.getByText('Shortcuts').click();
      await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
      await expect(page.getByText('Shift+Click')).toBeVisible();
      await expect(page.getByText('Shift+Drag')).toBeVisible();
      await page.locator('text=Keyboard Shortcuts').locator('..').getByRole('button').click();
      await expect(page.getByText('Keyboard Shortcuts')).not.toBeVisible();
    });
  });

  test.describe('Export', () => {
    test('should show Export button', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText('Export')).toBeVisible();
    });
  });
});
