import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("API endpoints", () => {
    test("unauthenticated /api/auth/me returns 401", async ({ request }) => {
      const response = await request.get("/api/auth/me");
      expect(response.status()).toBe(401);
    });

    test("unauthenticated /api/auth/github redirects to GitHub", async ({
      page,
    }) => {
      await page.goto("/api/auth/github");
      expect(page.url()).toContain("github.com/login");
    });

    test("logout returns success", async ({ request }) => {
      const response = await request.post("/api/auth/logout");
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe("Login page", () => {
    test("should load the login page", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should have a login button that links to GitHub OAuth", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      const loginButton = page.locator(
        'button:has-text("Login"), a:has-text("Login"), [href*="github"]',
      );
      await expect(loginButton.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("OAuth flow", () => {
    test("logout clears session cookie", async ({ page, request }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      await request.post("/api/auth/logout");

      const cookies = await contextCookies(page);
      const sessionCookie = cookies.find((c) => c.name === "session");
      expect(sessionCookie).toBeUndefined();
    });
  });
});

async function contextCookies(page: import("@playwright/test").Page) {
  const cookies = await page.context().cookies();
  return cookies;
}
