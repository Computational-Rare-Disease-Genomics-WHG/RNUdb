import { test, expect } from '@playwright/test';
import { mockCuratorAuth, mockGuestAuth } from './utils/mock-auth';

const NUCLEOTIDES = 'g.nucleotides-layer circle';
const BONDS = 'g.bonds-layer line';

async function pressKey(page: any, key: string) {
  await page.evaluate((k) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  }, key);
}

async function addNucleotide(page: any) {
  await pressKey(page, 'n');
}

async function addNNucleotides(page: any, n: number) {
  for (let i = 0; i < n; i++) {
    await pressKey(page, 'n');
  }
}

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

  test.describe('Adding Nucleotides', () => {
    test('should add nucleotide via keyboard shortcut N', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNucleotide(page);
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(1);
    });

    test('should add nucleotide via Add mode + canvas click', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('button:has(svg.lucide-plus)').click();
      const canvas = page.locator('[tabindex="0"]').first();
      const box = await canvas.boundingBox();
      if (box) {
        await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      }
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(1);
    });

    test('should add multiple nucleotides', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNNucleotides(page, 3);
      await page.waitForTimeout(200);
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(3);
    });
  });

  test.describe('Selecting Nucleotides', () => {
    test.beforeEach(async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNNucleotides(page, 2);
      await page.waitForTimeout(200);
    });

    test('should select a nucleotide on click', async ({ page }) => {
      const circles = page.locator(NUCLEOTIDES);
      await expect(circles).toHaveCount(2);
      await circles.first().click();
      await expect(page.getByText(/Delete \(\d+\)/)).toBeVisible();
    });

    test('should show selected count in delete button', async ({ page }) => {
      await addNucleotide(page);
      await page.waitForTimeout(200);
      const circles = page.locator(NUCLEOTIDES);
      await expect(circles).toHaveCount(3);
      await circles.nth(0).click({ modifiers: ['Shift'] });
      await circles.nth(1).click({ modifiers: ['Shift'] });
      await expect(page.getByText(/Delete \(2\)/)).toBeVisible();
    });

    test('should clear selection on Esc', async ({ page }) => {
      const circles = page.locator(NUCLEOTIDES);
      await expect(circles).toHaveCount(2);
      await circles.first().click();
      await expect(page.getByText(/Delete/)).toBeVisible();
      await pressKey(page, 'Escape');
      await expect(page.getByText(/Delete/)).not.toBeVisible();
    });

    test('should clear selection when clicking empty canvas', async ({ page }) => {
      const circles = page.locator(NUCLEOTIDES);
      await expect(circles).toHaveCount(2);
      await circles.first().click();
      await expect(page.getByText(/Delete/)).toBeVisible();
      const canvas = page.locator('[tabindex="0"]').first();
      const box = await canvas.boundingBox();
      if (box) {
        await canvas.click({ position: { x: box.width - 10, y: box.height - 10 } });
      }
      await expect(page.getByText(/Delete/)).not.toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNucleotide(page);
      await page.waitForTimeout(200);
    });

    test('should set base to A with keyboard', async ({ page }) => {
      await pressKey(page, 'a');
      await expect(page.locator('g.nucleotides-layer text').first()).toHaveText('A');
    });

    test('should set base to C with keyboard', async ({ page }) => {
      await pressKey(page, 'c');
      await expect(page.locator('g.nucleotides-layer text').first()).toHaveText('C');
    });

    test('should set base to G with keyboard', async ({ page }) => {
      await pressKey(page, 'g');
      await expect(page.locator('g.nucleotides-layer text').first()).toHaveText('G');
    });

    test('should set base to U with keyboard', async ({ page }) => {
      await pressKey(page, 'u');
      await expect(page.locator('g.nucleotides-layer text').first()).toHaveText('U');
    });

    test('should delete nucleotide with Delete key', async ({ page }) => {
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(1);
      await pressKey(page, 'Delete');
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(0);
    });

    test('should delete nucleotide with Backspace key', async ({ page }) => {
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(1);
      await pressKey(page, 'Backspace');
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(0);
    });

    test('should navigate between nucleotides with arrow keys', async ({ page }) => {
      await addNNucleotides(page, 2);
      await page.waitForTimeout(200);
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(3);
      await page.locator(NUCLEOTIDES).first().click();
      await pressKey(page, 'ArrowRight');
    });
  });

  test.describe('Keyboard Shortcuts Overlay', () => {
    test('should toggle shortcuts overlay', async ({ page }) => {
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

  test.describe('Delete Operations', () => {
    test('should delete selected nucleotide via Delete button', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNNucleotides(page, 2);
      await page.waitForTimeout(200);
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(2);
      await page.locator(NUCLEOTIDES).first().click();
      await page.getByText(/Delete/).click();
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(1);
    });

    test('should delete multiple selected nucleotides', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNNucleotides(page, 3);
      await page.waitForTimeout(200);
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(3);
      await page.locator(NUCLEOTIDES).nth(0).click({ modifiers: ['Shift'] });
      await page.locator(NUCLEOTIDES).nth(1).click({ modifiers: ['Shift'] });
      await page.getByText(/Delete/).click();
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(1);
    });
  });

  test.describe('Pair Mode', () => {
    test('should create base pair between two nucleotides', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNNucleotides(page, 2);
      await page.waitForTimeout(200);
      await expect(page.locator(NUCLEOTIDES)).toHaveCount(2);
      await page.locator('button:has(svg.lucide-link)').click();
      await page.locator(NUCLEOTIDES).nth(0).click();
      await page.locator(NUCLEOTIDES).nth(1).click();
      await expect(page.locator(BONDS)).toHaveCount(1);
    });
  });

  test.describe('Export', () => {
    test('should show Export button', async ({ page }) => {
      mockCuratorAuth(page);
      await page.goto('/editor');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('g.nucleotides-layer');
      await addNucleotide(page);
      await pressKey(page, 'a');
      await addNucleotide(page);
      await pressKey(page, 'u');
      await expect(page.getByText('Export')).toBeVisible();
    });
  });
});
