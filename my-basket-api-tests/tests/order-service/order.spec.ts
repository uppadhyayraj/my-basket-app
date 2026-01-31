import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('Order Service API Tests', () => {
  const userId = 'order-test-user';
  let productId: string;
  let orderId: string;
  let productData: any;

  const address = {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Testland'
  };

  const paymentMethod = {
    type: 'credit_card',
    last4: '4242',
    brand: 'Visa'
  };

  test.beforeAll(async ({ productApi, cartApi }) => {
    // 1. Get a product
    const prodResp = await productApi.getAllProducts();
    const body = await prodResp.json();
    productId = body.products[0].id;
    productData = body.products[0];

    // 2. Add to cart to ensure order can be created
    await cartApi.addItem(userId, productId, 1);
  });

  test.afterAll(async ({ cartApi }) => {
    await cartApi.clearCart(userId);
  });

  test.describe('Order Lifecycle', () => {
    
    test('should create order from cart', async ({ orderApi }) => {
      const orderPayload = {
        items: [{
          ...productData,
          quantity: 1
        }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod: paymentMethod
      };
      
      const response = await orderApi.createOrder(userId, orderPayload);
      await orderApi.assertStatus(response, 201);
      
      const body = await response.json();
      expect(body.id).toBeDefined();
      expect(body.userId).toBe(userId);
      expect(body.status).toBe('pending');
      orderId = body.id;
    });

    test('should get user orders', async ({ orderApi }) => {
      const response = await orderApi.getUserOrders(userId);
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.orders).toBeDefined();
      expect(Array.isArray(body.orders)).toBeTruthy();
      expect(body.orders.some((o: any) => o.id === orderId)).toBeTruthy();
    });

    test('should get specific order', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.getOrder(userId, orderId);
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.id).toBe(orderId);
    });

    test('should update order status', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.updateOrderStatus(userId, orderId, 'confirmed');
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.status).toBe('confirmed');
    });

    test('should cancel order', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.cancelOrder(userId, orderId);
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.status).toBe('cancelled');
    });
  });

  test.describe('Negative Testing', () => {
    test('should return 404 for non-existent order', async ({ orderApi }) => {
      const response = await orderApi.getOrder(userId, 'non-existent-order');
      expect(response.status()).toBe(404);
    });

    test('should fail to update status to invalid value', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.updateOrderStatus(userId, orderId, 'INVALID_STATUS');
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Challenge 1.3.4 - Data Integrity Checks (1.3.4Challenge)', () => {
    const challengeUser = 'challenge-1-3-4-user';

    test.afterEach(async ({ cartApi }) => {
      await cartApi.clearCart(challengeUser);
    });

    test('1.3.4Challenge - reject when order total does not match cart total', async ({ productApi, cartApi, orderApi }) => {
      // Setup: use an existing product and add to challenge user's cart
      const prodResp = await productApi.getAllProducts();
      const prodBody = await prodResp.json();
      const prod = prodBody.products[0];

      await cartApi.addItem(challengeUser, prod.id, 1);

      // Craft order payload with mismatched price (cart has prod.price, we send different price)
      const badOrder = {
        items: [{ ...prod, quantity: 1, price: (prod.price || 0) + 1.00 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const response = await orderApi.createOrder(challengeUser, badOrder);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      const body = await response.json().catch(() => ({}));
      expect(body.message || body.error || '').toContain('Data integrity');

      // Cart should remain unchanged
      const cartResp = await cartApi.getCart(challengeUser);
      await cartApi.assertStatus?.(cartResp, 200);
      const cartBody = await cartResp.json();
      expect(Array.isArray(cartBody.items) ? cartBody.items.length : (cartBody.items || []).length).toBeGreaterThan(0);
    });

    test('1.3.4Challenge - rounding to cents succeeds when totals match (0.3333 example)', async ({ productApi, cartApi, orderApi }) => {
      // Create product with price 0.3333
      const created = await productApi.createProduct({
        name: 'frac-product-3333',
        description: 'Fractional price test product',
        price: 0.3333,
        category: 'Test',
        inStock: true,
        image: 'http://example.com/frac.png',
        dataAiHint: 'fraction',
        sku: 'FP3333'
      });
      await productApi.assertStatus(created, 201);
      const createdBody = await created.json();
      const prodId = createdBody.id;

      await cartApi.addItem(challengeUser, prodId, 3);

      // priceCents = Math.round(0.3333 * 100) = 33, totalCents = 33 * 3 = 99 => 0.99
      const orderPayload = {
        items: [{ ...createdBody, quantity: 3 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const resp = await orderApi.createOrder(challengeUser, orderPayload);
      await orderApi.assertStatus(resp, 201);
      const body = await resp.json();
      expect(body.totalAmount).toBeCloseTo(0.99, 2);
    });

    test('1.3.4Challenge - reject when order item price mismatches cart item price', async ({ productApi, cartApi, orderApi }) => {
      const prodResp = await productApi.getAllProducts();
      const prodBody = await prodResp.json();
      const prod = prodBody.products[0];

      await cartApi.addItem(challengeUser, prod.id, 1);

      const orderPayload = {
        items: [{ ...prod, quantity: 1, price: (prod.price || 0) - 0.01 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const response = await orderApi.createOrder(challengeUser, orderPayload);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
      const body = await response.json().catch(() => ({}));
      expect(body.message || body.error || '').toContain('Data integrity');
    });

    test('1.3.4Challenge - reject order with zero quantity', async ({ productApi, cartApi, orderApi }) => {
      const prodResp = await productApi.getAllProducts();
      const prodBody = await prodResp.json();
      const prod = prodBody.products[0];

      await cartApi.addItem(challengeUser, prod.id, 1);

      const orderPayload = {
        items: [{ ...prod, quantity: 0 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const response = await orderApi.createOrder(challengeUser, orderPayload);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });
  });
});
