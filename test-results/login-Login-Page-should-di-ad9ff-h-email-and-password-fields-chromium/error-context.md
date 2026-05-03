# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login Page >> should display login form with email and password fields
- Location: tests/e2e/login.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="email"], input[name="email"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[type="email"], input[name="email"]').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e6]:
      - link "RNUdb" [ref=e7] [cursor=pointer]:
        - /url: /
        - img [ref=e9]
        - generic [ref=e21]: RNUdb
      - navigation [ref=e22]:
        - button "Clinical" [ref=e24]:
          - img
          - text: Clinical
        - button "API" [ref=e25]:
          - img
          - text: API
        - button "Guide" [ref=e26]:
          - img
          - text: Guide
      - button "Sign In" [ref=e28]:
        - img
        - generic [ref=e29]: Sign In
  - main [ref=e30]:
    - generic [ref=e32]:
      - img [ref=e34]
      - heading "Curator Sign In" [level=1] [ref=e37]
      - paragraph [ref=e38]: Sign in with your GitHub account to access the curator dashboard.
      - button "Sign in with GitHub" [ref=e39]:
        - img
        - text: Sign in with GitHub
  - contentinfo [ref=e40]:
    - generic [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e43]:
          - img [ref=e45]
          - generic [ref=e57]: RNUdb
        - generic [ref=e58]:
          - link [ref=e59] [cursor=pointer]:
            - /url: mailto:contact@rarediseasegenomics.org
            - img [ref=e60]
          - link [ref=e63] [cursor=pointer]:
            - /url: https://github.com/rarediseasegenomics
            - img [ref=e64]
          - link [ref=e67] [cursor=pointer]:
            - /url: https://rarediseasegenomics.org
            - img [ref=e68]
      - paragraph [ref=e72]: © 2026 Computational Rare Disease Genomics. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Login Page', () => {
  4  |   test('should load the login page', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await page.waitForLoadState('networkidle');
  7  |     await expect(page).toHaveURL(/\/login/);
  8  |   });
  9  | 
  10 |   test('should display login form with email and password fields', async ({ page }) => {
  11 |     await page.goto('/login');
  12 |     await page.waitForLoadState('networkidle');
  13 |     
  14 |     const emailInput = page.locator('input[type="email"], input[name="email"]');
  15 |     const passwordInput = page.locator('input[type="password"], input[name="password"]');
  16 |     
> 17 |     await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
     |                                      ^ Error: expect(locator).toBeVisible() failed
  18 |     await expect(passwordInput.first()).toBeVisible({ timeout: 5000 });
  19 |   });
  20 | 
  21 |   test('should display sign in button', async ({ page }) => {
  22 |     await page.goto('/login');
  23 |     await page.waitForLoadState('networkidle');
  24 |     
  25 |     const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log In")');
  26 |     await expect(signInButton.first()).toBeVisible({ timeout: 5000 });
  27 |   });
  28 | 
  29 |   test('should have a header visible', async ({ page }) => {
  30 |     await page.goto('/login');
  31 |     await page.waitForLoadState('networkidle');
  32 |     
  33 |     const header = page.locator('header');
  34 |     await expect(header.first()).toBeVisible({ timeout: 5000 });
  35 |   });
  36 | });
```