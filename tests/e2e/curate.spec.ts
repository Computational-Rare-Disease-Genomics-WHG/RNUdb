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

    mockCuratorAuth(page);
    await page.route('/api/genes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'RNU4-2', name: 'RNU4-2', chromosome: '12', start: 1000000, end: 2000000 },
        ]),
      })
    );

    await page.waitForTimeout(500);

    const variantsTab = page.locator('button[value="variants"]');
    const structuresTab = page.locator('button[value="structures"]');
    const literatureTab = page.locator('button[value="literature"]');
    const bedtracksTab = page.locator('button[value="bedtracks"]');

    await expect(variantsTab).toBeVisible({ timeout: 5000 });
    await expect(structuresTab).toBeVisible({ timeout: 5000 });
    await expect(literatureTab).toBeVisible({ timeout: 5000 });
    await expect(bedtracksTab).toBeVisible({ timeout: 5000 });
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
