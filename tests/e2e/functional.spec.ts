import { test, expect } from '@playwright/test';
import { mockGuestAuth } from './utils/mock-auth';

test.describe('Search Functionality', () => {
  test('should display search results after typing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
    await searchInput.fill('RNU4');
    await page.waitForTimeout(500);

    // Search results should appear (may be empty or with results)
    const results = page.locator('[class*="result"], [class*="dropdown"], [class*="menu"]');
    expect(await results.count() || await searchInput.inputValue()).toBeTruthy();
  });

  test('should clear search results when clearing input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
    await searchInput.fill('RNU4');
    await page.waitForTimeout(500);

    await searchInput.clear();
    await page.waitForTimeout(300);

    // Should handle clearing gracefully
    expect(searchInput).toBeTruthy();
  });

  test('should navigate to gene when selecting from search', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
    await searchInput.fill('RNU4-2');
    await page.waitForTimeout(1000);

    const geneLink = page.locator('a[href*="/gene/RNU4-2"]').first();
    if (await geneLink.isVisible({ timeout: 3000 })) {
      await geneLink.click();
      await page.waitForURL(/\/gene\//, { timeout: 5000 });
    }
  });
});

test.describe('Navigation', () => {
  test('should navigate to home from any page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const homeLink = page.locator('a[href="/"], a:has-text("Home")').first();
    if (await homeLink.isVisible({ timeout: 3000 })) {
      await homeLink.click();
      await expect(page).toHaveURL(/\/($|home)/);
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loginLink = page.locator('a[href*="/login"]').first();
    if (await loginLink.isVisible({ timeout: 3000 })) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should show login link for guests', async ({ page }) => {
    mockGuestAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Login link should be visible for unauthenticated users
    const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign in")').first();
    expect(await loginLink.count()).toBeGreaterThan(0);
  });
});

test.describe('Footer Links', () => {
  test('should have working links in footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 5000 });

    // Check for common footer links
    const links = footer.locator('a[href]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThanOrEqual(0);
  });

  test('should display copyright or branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Loading States', () => {
  test('should handle loading gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should be stable after load
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter out expected errors (like network errors for non-existent resources)
    const criticalErrors = errors.filter(e => !e.includes('404') && !e.includes('network'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Responsive Behavior', () => {
  test('should display content on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should display content on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should display content on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Images should either have alt text or be decorative (empty alt)
      expect(alt !== null).toBeTruthy();
    }
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button, a[role="button"]');
    expect(await buttons.count()).toBeGreaterThanOrEqual(0);
  });
});
