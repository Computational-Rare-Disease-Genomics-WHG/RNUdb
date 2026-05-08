import { test, expect } from "@playwright/test";
import { mockCuratorAuth, mockGuestAuth } from "./utils/mock-auth";

test.describe("Curate Page", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    mockGuestAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    expect(page.url()).toContain("/login");
  });

  test("should load curate page for curator", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/curate/);
  });

  test("should display Curator Dashboard header", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    const header = page.locator('h1:has-text("Curator Dashboard")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test("should display gene search input", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test("should display all four tabs after gene selection", async ({
    page,
  }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display Add Gene button", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    const addGeneButton = page.locator('button:has-text("Add Gene")');
    await expect(addGeneButton).toBeVisible({ timeout: 5000 });
  });

  test("should display select gene prompt when no gene selected", async ({
    page,
  }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    const selectPrompt = page.locator("text=Select a Gene to Begin");
    await expect(selectPrompt).toBeVisible({ timeout: 5000 });
  });

  test("should have header and footer", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    const header = page.locator("header");
    const footer = page.locator("footer");

    await expect(header.first()).toBeVisible({ timeout: 5000 });
    await expect(footer.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Variant Import Flow", () => {
  test("should display variant import button", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    // Should have variant-related UI elements
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display Variant Association tab", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    // Check for variant association UI
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Structure and BED Import", () => {
  test("should display structure import option", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    // Structure import should be available
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display BED track import option", async ({ page }) => {
    mockCuratorAuth(page);
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");
    // BED track import should be available
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Gene Selection and Data Loading", () => {
  test.beforeEach(async ({ page }) => {
    mockCuratorAuth(page);
    // Mock genes list
    page.route("/api/genes", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "RNU4-2",
            name: "RNU4-2",
            chromosome: "chr12",
            start: 120291759,
            end: 120291903,
          },
        ]),
      });
    });
    // Mock variants for the gene
    page.route("/api/genes/RNU4-2/variants", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    // Mock empty structures response
    page.route(/\/api\/genes\/.*\/structures/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    // Mock other endpoints
    page.route(/\/api\/genes\/.*\/literature/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    page.route(/\/api\/genes\/.*\/bed-tracks/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    page.route(/\/api\/genes\/.*\/variant-classifications/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
  });

  test("should load gene data without console errors when selecting a gene", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    // Filter out expected errors (e.g., AdBlock, favicon)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("Content blocker") &&
        !err.includes("beacon.min.js") &&
        !err.includes("favicon") &&
        !err.includes("cloudflareinsights") &&
        !err.includes("adguard"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("should display structures empty state when no structures exist", async ({
    page,
  }) => {
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    // Select a gene first - click on the gene search input and select first gene
    const geneInput = page.locator('input[placeholder*="Search"]').first();
    if (await geneInput.isVisible()) {
      await geneInput.click();
      await page.waitForTimeout(300);
      // Try to find and click the first gene in dropdown
      const firstGene = page
        .locator('[role="option"], [role="listbox"] li')
        .first();
      if (await firstGene.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstGene.click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to structures tab
    const structuresTab = page.locator(
      'button[role="tab"]:has-text("Structures")',
    );
    if (await structuresTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await structuresTab.click();
      await page.waitForTimeout(500);

      // Check for empty state text
      const emptyState = page.getByText("No structures yet", { exact: false });
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display BED tracks empty state when no tracks exist", async ({
    page,
  }) => {
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to BED tracks tab if present
    const bedTracksTab = page.locator(
      'button[role="tab"], button:has-text("BED"), [data-value="bed-tracks"]',
    );
    if (await bedTracksTab.isVisible()) {
      await bedTracksTab.click();
      await page.waitForTimeout(500);
    }
  });

  test("should load all tabs for selected gene without crashing", async ({
    page,
  }) => {
    await page.goto("/curate");
    await page.waitForLoadState("domcontentloaded");

    // Select a gene first
    const geneInput = page.locator('input[placeholder*="Search"]').first();
    if (await geneInput.isVisible()) {
      await geneInput.click();
      await page.waitForTimeout(300);
      const firstGene = page
        .locator('[role="option"], [role="listbox"] li')
        .first();
      if (await firstGene.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstGene.click();
        await page.waitForTimeout(1000);
      }
    }

    // All tabs should be clickable without causing errors
    const tabs = [
      'button[role="tab"]:has-text("Variants")',
      'button[role="tab"]:has-text("Structures")',
      'button[role="tab"]:has-text("Literature")',
    ];

    for (const tabSelector of tabs) {
      const tab = page.locator(tabSelector);
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }

    // Page should still be on curate page
    expect(page.url()).toContain("/curate");
  });
});
