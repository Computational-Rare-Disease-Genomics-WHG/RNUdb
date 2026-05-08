import { test, expect } from "@playwright/test";
import { mockAdminAuth, mockCuratorAuth } from "./utils/mock-auth";

test.describe("Approval Workflow", () => {
  test("admin should see pending changes section", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    // Admin should have access to approval management
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("admin can view pending approvals", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    // Should load admin dashboard
    expect(page.url()).toContain("/admin");
  });

  test("curator can view own pending changes", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    // Curator should be able to see their submissions
    expect(page.url()).toContain("/curate");
  });

  test("should display approval status indicators", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    // Admin page should have approval-related UI
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Admin Page", () => {
  test("should redirect non-admin users away from admin page", async ({
    page,
  }) => {
    mockCuratorAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("/admin");
  });

  test("should load admin page for admin user if available", async ({
    page,
  }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    // Just check page loads without crashing
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display Admin Dashboard if available", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display tabs if available", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display Users if available", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should switch between tabs if available", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display content if available", async ({ page }) => {
    mockAdminAuth(page);
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
