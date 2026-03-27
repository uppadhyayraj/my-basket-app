import { test, expect } from '@playwright/test';

test.describe('Product Service API Tests - discount field', () => {
  const baseURL = 'http://localhost:3001';

  test('GET /api/products - returns product list with discount field', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/products`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('products');
    expect(Array.isArray(body.products)).toBe(true);

    // Organic Apples (id=1) has discount: 10
    const apple = body.products.find((p: any) => p.id === '1');
    expect(apple).toBeDefined();
    expect(apple.discount).toBeCloseTo(10, 2);
  });

  test('GET /api/products/:id - returns single product with discount field', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/products/1`);
    expect(response.status()).toBe(200);

    const product = await response.json();
    expect(product.id).toBe('1');
    expect(product.name).toBe('Organic Apples');
    expect(product.price).toBeCloseTo(3.99, 2);
    expect(product.discount).toBeCloseTo(10.0, 2);
  });

  test('GET /api/products/:id - product without discount returns no discount field', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/products/2`);
    expect(response.status()).toBe(200);

    const product = await response.json();
    expect(product.id).toBe('2');
    expect(product.discount).toBeUndefined();
  });

  test('POST /api/products - creates product with discount field', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/products`, {
      data: {
        name: 'Discounted Mangoes',
        price: 5.99,
        discount: 12.50,
        description: 'Sweet tropical mangoes, now at a discount.',
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&h=400&fit=crop&auto=format',
        dataAiHint: 'mango fruit',
        category: 'fruits',
        inStock: true,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Discounted Mangoes');
    expect(created.discount).toBeCloseTo(12.50, 2);
  });

  test('POST /api/products - creates product without discount (field is optional)', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/products`, {
      data: {
        name: 'Plain Oats',
        price: 2.99,
        description: 'Rolled oats with no discount.',
        image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&h=400&fit=crop&auto=format',
        dataAiHint: 'oats grains',
        category: 'grains',
        inStock: true,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.discount).toBeUndefined();
  });

  test('PUT /api/products/:id - updates discount field on existing product', async ({ request }) => {
    const response = await request.put(`${baseURL}/api/products/6`, {
      data: { discount: 25.99 },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.id).toBe('6');
    expect(updated.discount).toBeCloseTo(25.99, 2);
  });

  test('PUT /api/products/:id - clears discount by setting to 0', async ({ request }) => {
    const response = await request.put(`${baseURL}/api/products/6`, {
      data: { discount: 0 },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.discount).toBe(0);
  });

  test('GET /api/products - filter by category returns discount field', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/products?category=fruits`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.products.length).toBeGreaterThan(0);
    body.products.forEach((p: any) => {
      expect(p.category).toBe('fruits');
    });
  });
});
