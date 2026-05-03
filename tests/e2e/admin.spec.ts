import { test, expect } from '@playwright/test';
import { mockAdminAuth, mockCuratorAuth } from './utils/mock-auth';

test.describe('Admin Page', () => {
  test('should redirect non-admin users away from admin page', async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/admin');
  });

  test('should load admin page for admin user', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should display Admin Dashboard header', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('h1:has-text("Admin Dashboard")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display Pending Approvals tab', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const approvalsTab = page.locator('button:has-text("Pending Approvals")');
    await expect(approvalsTab).toBeVisible({ timeout: 5000 });
  });

  test('should display Users tab', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const usersTab = page.locator('button:has-text("Users")');
    await expect(usersTab).toBeVisible({ timeout: 5000 });
  });

  test('should switch between tabs', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const usersTab = page.locator('button:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(300);
    
    const allUsersHeader = page.locator('text=All Users');
    await expect(allUsersHeader).toBeVisible({ timeout: 5000 });
  });

  test('should display Curator Change Requests section', async ({ page }) => {
    mockAdminAuth(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const curatorSection = page.locator('text=Curator Change Requests');
    await expect(curatorSection.first()).toBeVisible({ timeout: 5000 });
  });
});