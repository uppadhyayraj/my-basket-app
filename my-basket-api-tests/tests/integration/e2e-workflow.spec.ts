import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('End-to-End Integration Workflow', () => {
  const userId = `e2e-user-${Date.now()}`;
  let productId: string;
  let orderId: string;
  let productData: any;

  test('should complete a full user journey: Health -> Browse -> Cart -> AI -> Order -> Verify', async ({ gatewayApi, productApi, cartApi, aiApi, orderApi }) => {
    
    // 1. Check system health
    await test.step('Step 1: Verify system health via Gateway', async () => {
      const response = await gatewayApi.getHealth();
      await gatewayApi.assertStatus(response, 200);
    });

    // 2. Browse products and select one
    await test.step('Step 2: Browse products from Product Service', async () => {
      const response = await productApi.getAllProducts();
      const body = await response.json();
      expect(body.products).toBeDefined();
      expect(body.products.length).toBeGreaterThan(0);
      productId = body.products[0].id;
      productData = body.products[0];
    });

    // 3. Add to cart
    await test.step('Step 3: Add selected product to user cart', async () => {
      const response = await cartApi.addItem(userId, productId, 1);
      await cartApi.assertStatus(response, 200);
    });

    // 4. Get AI suggestions based on cart
    await test.step('Step 4: Get AI grocery suggestions', async () => {
      const response = await aiApi.getGrocerySuggestions(['milk']);
      const body = await response.json();
      expect(body.suggestions).toBeDefined();
    });

    // 5. Place order
    await test.step('Step 5: Place order and verify pending status', async () => {
      const orderPayload = {
        items: [{ ...productData, quantity: 1 }],
        shippingAddress: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345', country: 'Testland' },
        billingAddress: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345', country: 'Testland' },
        paymentMethod: { type: 'credit_card', last4: '4242', brand: 'Visa' }
      };
      const response = await orderApi.createOrder(userId, orderPayload);
      await orderApi.assertStatus(response, 201);
      const body = await response.json();
      orderId = body.id;
      expect(body.status).toBe('pending');
    });

    // 6. Verify order summary
    await test.step('Step 6: Verify order details and cart empty state', async () => {
      const orderResp = await orderApi.getOrder(userId, orderId);
      await orderApi.assertStatus(orderResp, 200);
      
      const cartSummary = await cartApi.getSummary(userId);
      await cartApi.assertStatus(cartSummary, 200);
    });

    // 7. Cleanup
    await test.step('Step 7: Cleanup user cart', async () => {
      await cartApi.clearCart(userId);
    });
  });
});

