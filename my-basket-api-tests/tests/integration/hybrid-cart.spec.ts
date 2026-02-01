import { test, expect, request } from '@playwright/test';
import { CartPage } from '../pages/CartPage';

test('Hybrid Integration: Seed data via API, verify via UI', async ({ page }) => {
  const cartPage = new CartPage(page);
  const userId = `hybrid-test-user-${Date.now()}`;
  const gatewayURL = process.env.GATEWAY_URL || 'http://localhost:3000';
  const apiContext = await request.newContext({
    baseURL: gatewayURL
  });
  
  let product: any;

  // 1. Arrange: POST a valid item to the API
  await test.step('Arrange: Seed data via API', async () => {
    // Get a product first
    const productsResponse = await apiContext.get('/api/products?limit=1');
    expect(productsResponse.ok()).toBeTruthy();
    const products = await productsResponse.json();
    product = products.products[0];
    console.log(`Seeding product: ${product.name}`);

    // Add to cart via API
    const addToCartResponse = await apiContext.post(`/api/cart/${userId}/items`, {
      data: {
        productId: product.id,
        quantity: 1
      }
    });
    expect(addToCartResponse.ok()).toBeTruthy();
  });

  // 2. Act: Set User ID and Navigate to Cart
  await test.step('Act: Navigate to Cart', async () => {
    // Navigate to home first to set localStorage, then go to cart
    await page.goto('/');
    await page.evaluate((id) => {
      localStorage.setItem('demo_user_id', id);
    }, userId);
    await cartPage.goto();
  });

  // 3. Assert: Verify item is visible
  await test.step('Assert: Verify product in UI', async () => {
    await cartPage.verifyItemVisible(product.name);
  });

  // 4. Cleanup
  await test.step('Cleanup', async () => {
    await apiContext.delete(`/api/cart/${userId}`);
    await apiContext.dispose();
  });
});
