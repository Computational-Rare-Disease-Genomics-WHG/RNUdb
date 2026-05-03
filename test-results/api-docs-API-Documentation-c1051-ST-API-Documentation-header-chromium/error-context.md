# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-docs.spec.ts >> API Documentation Page >> should display REST API Documentation header
- Location: tests/e2e/api-docs.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("REST API Documentation")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h1:has-text("REST API Documentation")')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('API Documentation Page', () => {
  4  |   test('should load the API documentation page', async ({ page }) => {
  5  |     await page.goto('/api-docs');
  6  |     await page.waitForLoadState('networkidle');
  7  |     await expect(page).toHaveURL(/\/api-docs/);
  8  |   });
  9  | 
  10 |   test('should display REST API Documentation header', async ({ page }) => {
  11 |     await page.goto('/api-docs');
  12 |     await page.waitForLoadState('networkidle');
  13 |     
  14 |     const header = page.locator('h1:has-text("REST API Documentation")');
> 15 |     await expect(header).toBeVisible({ timeout: 10000 });
     |                          ^ Error: expect(locator).toBeVisible() failed
  16 |   });
  17 | 
  18 |   test('should display tabs (Endpoints, Guides, Rate Limits)', async ({ page }) => {
  19 |     await page.goto('/api-docs');
  20 |     await page.waitForLoadState('networkidle');
  21 |     
  22 |     await expect(page.locator('button:has-text("Endpoints")')).toBeVisible({ timeout: 5000 });
  23 |     await expect(page.locator('button:has-text("Guides")')).toBeVisible({ timeout: 5000 });
  24 |     await expect(page.locator('button:has-text("Rate Limits")')).toBeVisible({ timeout: 5000 });
  25 |   });
  26 | 
  27 |   test('should display endpoint list in sidebar', async ({ page }) => {
  28 |     await page.goto('/api-docs');
  29 |     await page.waitForLoadState('networkidle');
  30 |     
  31 |     const endpointsHeading = page.locator('text=Endpoints');
  32 |     await expect(endpointsHeading.first()).toBeVisible({ timeout: 5000 });
  33 |   });
  34 | 
  35 |   test('should switch to Guides tab', async ({ page }) => {
  36 |     await page.goto('/api-docs');
  37 |     await page.waitForLoadState('networkidle');
  38 |     
  39 |     await page.locator('button:has-text("Guides")').click();
  40 |     await page.waitForTimeout(500);
  41 |     
  42 |     const gettingStarted = page.locator('text=Getting Started');
  43 |     await expect(gettingStarted.first()).toBeVisible({ timeout: 5000 });
  44 |   });
  45 | 
  46 |   test('should switch to Rate Limits tab', async ({ page }) => {
  47 |     await page.goto('/api-docs');
  48 |     await page.waitForLoadState('networkidle');
  49 |     
  50 |     await page.locator('button:has-text("Rate Limits")').click();
  51 |     await page.waitForTimeout(500);
  52 |     
  53 |     const rateLimiting = page.locator('text=Rate Limiting Policy');
  54 |     await expect(rateLimiting.first()).toBeVisible({ timeout: 5000 });
  55 |   });
  56 | 
  57 |   test('should display API Console section', async ({ page }) => {
  58 |     await page.goto('/api-docs');
  59 |     await page.waitForLoadState('networkidle');
  60 |     
  61 |     const apiConsole = page.locator('text=API Console');
  62 |     await expect(apiConsole.first()).toBeVisible({ timeout: 5000 });
  63 |   });
  64 | 
  65 |   test('should display Code Examples section', async ({ page }) => {
  66 |     await page.goto('/api-docs');
  67 |     await page.waitForLoadState('networkidle');
  68 |     
  69 |     const codeExamples = page.locator('text=Code Examples');
  70 |     await expect(codeExamples.first()).toBeVisible({ timeout: 5000 });
  71 |   });
  72 | 
  73 |   test('should display code tabs (cURL, Python, JavaScript, Bash)', async ({ page }) => {
  74 |     await page.goto('/api-docs');
  75 |     await page.waitForLoadState('networkidle');
  76 |     
  77 |     await expect(page.locator('button:has-text("cURL")')).toBeVisible({ timeout: 5000 });
  78 |     await expect(page.locator('button:has-text("Python")')).toBeVisible({ timeout: 5000 });
  79 |     await expect(page.locator('button:has-text("JavaScript")')).toBeVisible({ timeout: 5000 });
  80 |     await expect(page.locator('button:has-text("Bash")')).toBeVisible({ timeout: 5000 });
  81 |   });
  82 | 
  83 |   test('should show public endpoint badge', async ({ page }) => {
  84 |     await page.goto('/api-docs');
  85 |     await page.waitForLoadState('networkidle');
  86 |     
  87 |     const publicBadge = page.locator('text=Public');
  88 |     await expect(publicBadge.first()).toBeVisible({ timeout: 5000 });
  89 |   });
  90 | });
```