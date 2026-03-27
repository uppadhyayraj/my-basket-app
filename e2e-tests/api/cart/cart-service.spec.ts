import { test, expect } from '@playwright/test';

test.describe('Cart Service API Tests - discount field propagation', () => {
  const baseURL = 'http://localhost:3002';
  const testUserId = `testuser-${Date.now()}`;

  test('GET /api/cart/:userId - returns empty cart for new user', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/cart/${testUserId}`);
    expect(response.status()).toBe(200);

    const cart = await response.json();
    expect(cart).toHaveProperty('userId', testUserId);
    expect(cart.items).toHaveLength(0);
    expect(cart.totalAmount).toBe(0);
  });

  test('POST /api/cart/:userId/items - adds discounted product and preserves discount field', async ({ request }) => {
    // Add product 1 (Organic Apples, discount: 10%)
    const response = await request.post(`${baseURL}/api/cart/${testUserId}/items`, {
      data: { productId: '1', quantity: 2 },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const cart = await response.json();
    expect(cart.items).toHaveLength(1);

    const item = cart.items[0];
    expect(item.id).toBe('1');
    expect(item.name).toBe('Organic Apples');
    expect(item.price).toBeCloseTo(3.99, 2);
    expect(item.discount).toBeCloseTo(10, 2); // discount flows through from Product Service
    expect(item.quantity).toBe(2);
  });

  test('POST /api/cart/:userId/items - adds second discounted product (Chicken Breast, 25.99%)', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/cart/${testUserId}/items`, {
      data: { productId: '6', quantity: 1 },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const cart = await response.json();

    const chicken = cart.items.find((i: any) => i.id === '6');
    expect(chicken).toBeDefined();
    expect(chicken.discount).toBeCloseTo(25.99, 2);
  });

  test('GET /api/cart/:userId - discount field present on items after add', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/cart/${testUserId}`);
    expect(response.status()).toBe(200);

    const cart = await response.json();
    expect(cart.items.length).toBeGreaterThanOrEqual(1);

    // All items that have discounts should expose the discount field
    cart.items.forEach((item: any) => {
      if (item.id === '1') expect(item.discount).toBeCloseTo(10, 2);
      if (item.id === '6') expect(item.discount).toBeCloseTo(25.99, 2);
    });
  });

  test('GET /api/cart/:userId - product without discount has no discount field', async ({ request }) => {
    const addResponse = await request.post(`${baseURL}/api/cart/${testUserId}/items`, {
      data: { productId: '2', quantity: 1 }, // Whole Wheat Bread, no discount
      headers: { 'Content-Type': 'application/json' },
    });
    expect(addResponse.status()).toBe(200);

    const cart = await addResponse.json();
    const bread = cart.items.find((i: any) => i.id === '2');
    expect(bread).toBeDefined();
    expect(bread.discount).toBeUndefined();
  });
});
