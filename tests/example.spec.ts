import { test, expect } from '@playwright/test';

test.describe('SAT Practice App', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });

    // Basic assertion - check if the page has loaded
    await expect(page).toHaveTitle(/SAT/i);
  });

  test('can take element screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Example: screenshot of a specific element (adjust selector as needed)
    const mainElement = page.locator('body');
    await mainElement.screenshot({ path: 'tests/screenshots/main-content.png' });
  });

  test('mobile viewport screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take mobile screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-view.png', fullPage: true });
  });

  test('can navigate and capture different states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/state-initial.png' });

    // You can add interactions here and capture subsequent states
    // For example, clicking buttons, filling forms, etc.
  });
});
