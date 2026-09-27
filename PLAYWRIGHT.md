# Playwright Setup - Quick Reference

## Installation Complete ✓
- **Package**: @playwright/test installed
- **Browsers**: Chromium, Firefox, WebKit installed
- **Config**: playwright.config.ts configured
- **Tests**: Example tests in tests/example.spec.ts

## Available Commands

### Running Tests
```bash
npm test                    # Run all tests headlessly
npm run test:headed         # Run tests with browser visible
npm run test:ui             # Open Playwright UI mode (interactive)
npm run test:debug          # Run tests in debug mode
npm run test:report         # View last test report
```

### Code Generation (Browser Automation Recorder)
```bash
npm run test:codegen        # Opens browser, records your actions, generates test code
npx playwright codegen [url]  # Record actions on any URL
```

### Taking Screenshots

#### In Tests
```typescript
// Full page screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Element screenshot
await page.locator('.my-element').screenshot({ path: 'element.png' });

// Mobile viewport
await page.setViewportSize({ width: 375, height: 667 });
await page.screenshot({ path: 'mobile.png' });
```

#### Standalone Script
Create a file like `scripts/screenshot.ts`:
```typescript
import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: 'example.png', fullPage: true });
  await browser.close();
})();
```

Run with: `npx tsx scripts/screenshot.ts`

### Browser Automation Examples

#### Navigate and interact
```typescript
await page.goto('https://example.com');
await page.click('button.submit');
await page.fill('input[name="email"]', 'test@example.com');
await page.selectOption('select#country', 'US');
```

#### Wait for elements
```typescript
await page.waitForSelector('.dynamic-content');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Wait 1 second
```

#### Extract data
```typescript
const text = await page.textContent('.my-element');
const html = await page.innerHTML('.container');
const value = await page.inputValue('input[name="username"]');
```

#### Multiple pages/tabs
```typescript
const newPage = await context.newPage();
await newPage.goto('https://example.com');
```

## Useful Playwright Features

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Your test code
    await expect(page.locator('h1')).toHaveText('Expected Text');
  });
});
```

### Assertions
```typescript
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle('My App');
await expect(page.locator('.status')).toHaveText('Active');
await expect(page.locator('.error')).toBeVisible();
await expect(page.locator('.loading')).toBeHidden();
```

### Network Interception
```typescript
// Mock API responses
await page.route('**/api/data', route => {
  route.fulfill({ body: JSON.stringify({ data: 'mocked' }) });
});

// Monitor network requests
page.on('request', request => console.log(request.url()));
page.on('response', response => console.log(response.status()));
```

### Multi-Browser Testing
The config already includes Chromium, Firefox, and WebKit. Tests run across all browsers by default.

Run specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Configuration Highlights

- **Auto-start dev server**: Automatically runs `npm run dev` before tests
- **Base URL**: http://localhost:5173 (Vite default)
- **Screenshots**: Captured on test failure
- **Traces**: Recorded on first retry (for debugging)
- **Parallel execution**: Tests run in parallel for speed

## Next Steps

1. **Customize tests**: Edit `tests/example.spec.ts` for your app
2. **Use codegen**: Run `npm run test:codegen` to record interactions
3. **Add more tests**: Create new `.spec.ts` files in the `tests/` directory
4. **Explore UI mode**: Run `npm run test:ui` for interactive test development

## Documentation
- [Playwright Docs](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
