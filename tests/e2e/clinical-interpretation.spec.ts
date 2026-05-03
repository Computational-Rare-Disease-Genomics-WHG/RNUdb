import { test, expect } from '@playwright/test';

test.describe('Clinical Interpretation Page', () => {
  test('should load the clinical interpretation page', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/clinical-interpretation/);
  });

  test('should display Clinical Variant Classification header', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    const header = page.locator('h1:has-text("Clinical Variant Classification")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display all four tabs', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Overview")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Recommendations")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Examples")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Reference")')).toBeVisible({ timeout: 5000 });
  });

  test('should display snRNA information in Overview tab', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    const snRNASection = page.locator('text=What are snRNAs?');
    await expect(snRNASection).toBeVisible({ timeout: 5000 });
  });

  test('should display Key Challenges section', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    const keyChallenges = page.locator('text=Key Challenges');
    await expect(keyChallenges).toBeVisible({ timeout: 5000 });
  });

  test('should switch to Recommendations tab', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Recommendations")').click();
    await page.waitForTimeout(500);

    const validateVariant = page.locator('text=Validate Variant Calls');
    await expect(validateVariant.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to Examples tab', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Examples")').click();
    await page.waitForTimeout(500);

    const selectExample = page.locator('text=Select Example');
    await expect(selectExample.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to Reference tab', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Reference")').click();
    await page.waitForTimeout(500);

    const acmgCodes = page.locator('text=ACMG Evidence Codes');
    await expect(acmgCodes.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display Critical Pathogenic Regions table', async ({ page }) => {
    await page.goto('/clinical-interpretation');
    await page.waitForLoadState('networkidle');

    const regionsTable = page.locator('text=Critical Pathogenic Regions');
    await expect(regionsTable).toBeVisible({ timeout: 5000 });
  });
});
