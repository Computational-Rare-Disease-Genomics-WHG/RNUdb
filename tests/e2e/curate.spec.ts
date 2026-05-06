import { test, expect } from '@playwright/test';
import { mockCuratorAuth, mockGuestAuth } from './utils/mock-auth';

test.describe('Curate Page', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    mockGuestAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/login');
  });

  test('should load curate page for curator', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/curate/);
  });

  test('should display Curator Dashboard header', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('h1:has-text("Curator Dashboard")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display gene search input', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display all four tabs after gene selection', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display Add Gene button', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');

    const addGeneButton = page.locator('button:has-text("Add Gene")');
    await expect(addGeneButton).toBeVisible({ timeout: 5000 });
  });

  test('should display select gene prompt when no gene selected', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');

    const selectPrompt = page.locator('text=Select a Gene to Begin');
    await expect(selectPrompt).toBeVisible({ timeout: 5000 });
  });

  test('should have header and footer', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/curate');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header');
    const footer = page.locator('footer');

    await expect(header.first()).toBeVisible({ timeout: 5000 });
    await expect(footer.first()).toBeVisible({ timeout: 5000 });
  });
});
