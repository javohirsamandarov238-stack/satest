import { test, expect } from '@playwright/test';

test.describe('SAT Command Center Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders hero command deck with gauge and action buttons', async ({ page }) => {
    await expect(page.locator('.hero-command')).toBeVisible();
    await expect(page.locator('.hero-title')).toContainText('Your SAT practice');
    await expect(page.locator('.btn-hero')).toContainText('Start Practice');
    await expect(page.locator('.hero-gauge-card')).toBeVisible();
  });

  test('renders 4-pillar bento grid', async ({ page }) => {
    await expect(page.locator('.bento-grid')).toBeVisible();
    await expect(page.locator('.bento-card-practice')).toBeVisible();
    await expect(page.locator('.bento-card-vocab')).toBeVisible();
    await expect(page.locator('.bento-card-mistakes')).toBeVisible();
    await expect(page.locator('.bento-card-flagged')).toBeVisible();
  });

  test('filters 8 SAT domains matrix by section', async ({ page }) => {
    // Default has 8 domain cards
    await expect(page.locator('.domain-card')).toHaveCount(8);

    // Filter to Math (4)
    await page.locator('button:has-text("Math (4)")').click();
    await expect(page.locator('.domain-card')).toHaveCount(4);
    await expect(page.locator('.domain-card').first()).toContainText('Algebra');

    // Filter to Reading & Writing (4)
    await page.locator('button:has-text("Reading & Writing (4)")').click();
    await expect(page.locator('.domain-card')).toHaveCount(4);
    await expect(page.locator('.domain-card').first()).toContainText('Information and Ideas');

    // Back to All (8)
    await page.locator('button:has-text("All (8)")').click();
    await expect(page.locator('.domain-card')).toHaveCount(8);
  });

  test('toggles theme between dark and light smoothly', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Toggle to light
    await page.locator('.themer').click();
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Toggle back to dark
    await page.locator('.themer').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('can launch domain drill directly from card', async ({ page }) => {
    await page.locator('.domain-card', { hasText: 'Information and Ideas' }).click();
    await expect(page.locator('.question-header, .q-header, h1, .wrap-read')).toBeVisible();
  });
});
