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
      const header = page.locator('header');
      await expect(header.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display SVG element', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      const svg = page.locator('svg');
      await expect(svg.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display empty state message', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      const emptyState = page.getByText('Start Creating');
      await expect(emptyState).toBeVisible({ timeout: 5000 });
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
      const zoomPercent = page.getByText('100%');
      await expect(zoomPercent).toBeVisible();
    });

    test('should zoom in when clicking zoom in button', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      const zoomIn = page.locator('button:has(svg.lucide-zoom-in)');
      await zoomIn.click();
      await expect(page.getByText('125%')).toBeVisible();
    });

    test('should zoom out when clicking zoom out button', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      const zoomOut = page.locator('button:has(svg.lucide-zoom-out)');
      await zoomOut.click();
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

  test.describe('Adding Nucleotides', () => {
    test('should add nucleotide via keyboard shortcut N', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
      const circles = page.locator('svg circle');
      await expect(circles).toHaveCount(1);
    });

    test('should add nucleotide via Add mode + canvas click', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('button:has(svg.lucide-plus)').click();
      const canvas = page.locator('div.absolute.inset-0').first();
      await canvas.click({ position: { x: 400, y: 300 } });
      const circles = page.locator('svg circle');
      await expect(circles).toHaveCount(1);
    });

    test('should add multiple nucleotides', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
      await page.keyboard.press('n');
      await page.keyboard.press('n');
      const circles = page.locator('svg circle');
      await expect(circles).toHaveCount(3);
    });
  });

  test.describe('Selecting Nucleotides', () => {
    test.beforeEach(async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
      await page.keyboard.press('n');
    });

    test('should select a nucleotide on click', async ({ page }) => {
      const circles = page.locator('svg circle');
      await circles.first().click();
      const deleteButton = page.getByText(/Delete \(\d+\)/);
      await expect(deleteButton).toBeVisible();
    });

    test('should show selected count in delete button', async ({ page }) => {
      await page.keyboard.press('n');
      const circles = page.locator('svg circle');
      const firstNuc = circles.nth(0);
      const secondNuc = circles.nth(1);
      await firstNuc.click({ modifiers: ['Shift'] });
      await secondNuc.click({ modifiers: ['Shift'] });
      const deleteBtn = page.getByText(/Delete \(2\)/);
      await expect(deleteBtn).toBeVisible();
    });

    test('should clear selection on Esc', async ({ page }) => {
      const circles = page.locator('svg circle');
      await circles.first().click();
      await expect(page.getByText(/Delete/)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByText(/Delete/)).not.toBeVisible();
    });

    test('should clear selection when clicking empty canvas', async ({ page }) => {
      const circles = page.locator('svg circle');
      await circles.first().click();
      await expect(page.getByText(/Delete/)).toBeVisible();
      const canvas = page.locator('div.absolute.inset-0').first();
      await canvas.click({ position: { x: 100, y: 100 } });
      await expect(page.getByText(/Delete/)).not.toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
    });

    test('should set base to A with keyboard', async ({ page }) => {
      await page.keyboard.press('a');
      const text = page.locator('svg text').first();
      await expect(text).toHaveText('A');
    });

    test('should set base to C with keyboard', async ({ page }) => {
      await page.keyboard.press('c');
      const text = page.locator('svg text').first();
      await expect(text).toHaveText('C');
    });

    test('should set base to G with keyboard', async ({ page }) => {
      await page.keyboard.press('g');
      const text = page.locator('svg text').first();
      await expect(text).toHaveText('G');
    });

    test('should set base to U with keyboard', async ({ page }) => {
      await page.keyboard.press('u');
      const text = page.locator('svg text').first();
      await expect(text).toHaveText('U');
    });

    test('should delete nucleotide with Delete key', async ({ page }) => {
      await expect(page.locator('svg circle')).toHaveCount(1);
      await page.keyboard.press('Delete');
      await expect(page.locator('svg circle')).toHaveCount(0);
    });

    test('should delete nucleotide with Backspace key', async ({ page }) => {
      await expect(page.locator('svg circle')).toHaveCount(1);
      await page.keyboard.press('Backspace');
      await expect(page.locator('svg circle')).toHaveCount(0);
    });

    test('should navigate between nucleotides with arrow keys', async ({ page }) => {
      await page.keyboard.press('n');
      await page.keyboard.press('n');
      const circles = page.locator('svg circle');
      await expect(circles).toHaveCount(3);
      await circles.first().click();
      await page.keyboard.press('ArrowRight');
    });
  });

  test.describe('Keyboard Shortcuts Overlay', () => {
    test('should toggle shortcuts overlay', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      const shortcutsButton = page.getByText('Shortcuts');
      await shortcutsButton.click();
      await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
      await expect(page.getByText('Shift+Click')).toBeVisible();
      await expect(page.getByText('Shift+Drag')).toBeVisible();
      await page.getByText('Keyboard Shortcuts').locator('..').getByRole('button').click();
      await expect(page.getByText('Keyboard Shortcuts')).not.toBeVisible();
    });
  });

  test.describe('Delete Operations', () => {
    test('should delete selected nucleotide via Delete button', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
      await page.keyboard.press('n');
      await expect(page.locator('svg circle')).toHaveCount(2);
      await page.locator('svg circle').first().click();
      await page.getByText(/Delete/).click();
      await expect(page.locator('svg circle')).toHaveCount(1);
    });

    test('should delete multiple selected nucleotides', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
      await page.keyboard.press('n');
      await page.keyboard.press('n');
      await expect(page.locator('svg circle')).toHaveCount(3);
      const circle1 = page.locator('svg circle').nth(0);
      const circle2 = page.locator('svg circle').nth(1);
      await circle1.click({ modifiers: ['Shift'] });
      await circle2.click({ modifiers: ['Shift'] });
      await page.getByText(/Delete/).click();
      await expect(page.locator('svg circle')).toHaveCount(1);
    });
  });

  test.describe('Pair Mode', () => {
    test('should create base pair between two nucleotides', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
      await page.keyboard.press('n');
      await page.locator('button:has(svg.lucide-link)').click();
      const circles = page.locator('svg circle');
      await circles.nth(0).click();
      await circles.nth(1).click();
      const lines = page.locator('svg line');
      await expect(lines).toHaveCount(1);
    });
  });

  test.describe('Export', () => {
    test('should export RNA data when clicking Export button', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.keyboard.press('n');
      await page.keyboard.press('a');
      await page.keyboard.press('n');
      await page.keyboard.press('u');
      const exportBtn = page.getByText('Export');
      await expect(exportBtn).toBeVisible();
    });
  });
});
