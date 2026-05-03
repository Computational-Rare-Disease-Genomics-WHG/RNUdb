import { test, expect } from '@playwright/test';

test.describe('How To Use Page', () => {
  test('should load the how to use page', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/how-to-use/);
  });

  test('should display How to Use RNUdb header', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('h1:has-text("How to Use RNUdb")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display all three tabs', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('button:has-text("Getting Started")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Guides")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("FAQ")')).toBeVisible({ timeout: 5000 });
  });

  test('should display Getting Started cards in default tab', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');

    const searchGenes = page.locator('text=Search Genes');
    await expect(searchGenes.first()).toBeVisible({ timeout: 5000 });

    const viewStructures = page.locator('text=View Structures');
    await expect(viewStructures.first()).toBeVisible({ timeout: 5000 });

    const dataOverlays = page.locator('text=Data Overlays');
    await expect(dataOverlays.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to Guides tab', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button:has-text("Guides")').click();
    await page.waitForTimeout(500);

    const publicUserGuide = page.locator('text=Public User Guide');
    await expect(publicUserGuide.first()).toBeVisible({ timeout: 5000 });

    const curatorGuide = page.locator('text=Curator Guide');
    await expect(curatorGuide.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to FAQ tab', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button:has-text("FAQ")').click();
    await page.waitForTimeout(500);

    const generalQuestions = page.locator('text=General Questions');
    await expect(generalQuestions.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display note on data sources', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');

    const dataSourcesNote = page.locator('text=Note on Data Sources');
    await expect(dataSourcesNote).toBeVisible({ timeout: 5000 });
  });

  test('should display Admin Guide in Guides tab', async ({ page }) => {
    await page.goto('/how-to-use');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button:has-text("Guides")').click();
    await page.waitForTimeout(500);

    const adminGuide = page.locator('text=Admin Guide');
    await expect(adminGuide.first()).toBeVisible({ timeout: 5000 });
  });
});
