import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';

test('Verify that the Cart page displays an empty message when no items are added', async ({ page }) => {
  const cartPage = new CartPage(page);

  await test.step('Mock API response', async () => {
    // Mock the /api/cart endpoint to return an empty array []
    // Matches any request to /api/cart - usually /api/cart/{userId}
    await page.route('**/api/cart/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
  });

  await test.step('Navigate to Cart Page', async () => {
    await cartPage.goto();
  });

  await test.step('Verify Empty State', async () => {
    // Verify the "Empty State" UI element is visible.
    await cartPage.verifyEmptyState();
  });
});
