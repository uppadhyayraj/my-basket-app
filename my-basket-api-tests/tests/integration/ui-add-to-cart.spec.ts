import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Home Page UI Tests', () => {
  test('User can add first product to basket', async ({ page }) => {
    // Mock the Cart API to ensure UI works even if backend is down
    await page.route('**/api/cart/*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-cart-id',
            items: [],
            totalAmount: 0,
            totalItems: 0
          })
        });
      } else if (method === 'DELETE') {
         await route.fulfill({ status: 200, json: { id: 'mock-cart-id', items: [], totalItems: 0 } });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/cart/*/items', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-cart-id',
            items: [{
              id: 'mock-item-id',
              name: 'Mock Product',
              price: 10,
              quantity: 1,
              image: '',
              productId: '1'
            }],
            totalAmount: 10,
            totalItems: 1
          })
        });
      } else {
        await route.continue();
      }
    });

    const homePage = new HomePage(page);
    
    await test.step('Navigate to Home Page', async () => {
      await homePage.goto();
      try {
        await homePage.verifyPageLoaded();
      } catch (e) {
        console.log('PAGE CONTENT ON FAILURE:');
        console.log(await page.content());
        throw e;
      }
    });

    await test.step('Add first product to cart', async () => {
      await homePage.addFirstProductToBasket();
    });

    await test.step('Verify "Item added" toast appears', async () => {
      await homePage.verifyToastVisible('Added to cart');
    });
  });
});
