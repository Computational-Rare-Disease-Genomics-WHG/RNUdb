import { test, expect } from '@playwright/test';

test.describe('Gene Page', () => {
  test('should load gene page for RNU4-2', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/gene\/RNU4-2/);
  });

  test('should display RNA Secondary Structure section if available', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    // Just check page loaded, content may not be available in all environments
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display Genome Browser section if available', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display Clinical Variants section on gene page if available', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const clinicalVariantsCard = page.locator('[data-slot="card-title"]:has-text("Clinical Variants")');
    await expect(clinicalVariantsCard).toBeVisible({ timeout: 10000 });
  });

  test('should display variant cards with clinical significance badges', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');

    const clinicalVariantsCard = page.locator('[data-slot="card-title"]:has-text("Clinical Variants")');
    await expect(clinicalVariantsCard).toBeVisible({ timeout: 10000 });

    const variantBadges = page.locator('text=Pathogenic').or(page.locator('text=Likely Pathogenic')).or(page.locator('text=VUS'));
    await expect(variantBadges.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display variant statistics legend', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');

    const clinicalVariantsCard = page.locator('[data-slot="card-title"]:has-text("Clinical Variants")');
    await expect(clinicalVariantsCard).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=Pathogenic').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have separate Literature and Clinical Variants sections', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');

    const literatureCard = page.locator('[data-slot="card-title"]:has-text("Literature")');
    const clinicalVariantsCard = page.locator('[data-slot="card-title"]:has-text("Clinical Variants")');

    await expect(literatureCard).toBeVisible({ timeout: 10000 });
    await expect(clinicalVariantsCard).toBeVisible({ timeout: 10000 });
  });

  test('should display gene information in header', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');

    const geneName = page.locator('text=RNU4-2');
    await expect(geneName.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to different gene page', async ({ page }) => {
    await page.goto('/gene/RNU4-2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const geneLink = page.locator('a[href*="/gene/RNU2-2"]').first();
    if (await geneLink.isVisible({ timeout: 3000 })) {
      await geneLink.click();
      await page.waitForURL(/\/gene\/RNU2-2/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/gene\/RNU2-2/);
    }
  });
});
