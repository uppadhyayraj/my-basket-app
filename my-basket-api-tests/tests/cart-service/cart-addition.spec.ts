import { test, expect } from '../../src/fixtures/api-fixtures';

/**
 * Cart Addition Functionality Test Suite
 * Tests POST http://localhost:3002/api/cart/{userId}/items
 * 
 * Requirements:
 * - Send request with valid productId and quantity
 * - Verify 200 OK response
 * - Verify response contains updated cart items
 * - Verify total price is updated
 */
test.describe('Cart Addition Functionality', () => {
  const testUserId = 'test-user';
  let productId: string;
  let productPrice: number;

  test.beforeAll(async ({ cartApi, productApi }) => {
    try {
      // Clear cart first to ensure clean state
      await cartApi.clearCart(testUserId);
      
      // Get or create a product for testing
      const response = await productApi.getAllProducts();
      const body = await response.json();
      
      if (body.products && body.products.length > 0) {
        productId = body.products[0].id;
        productPrice = body.products[0].price;
        console.log(`Using existing product: ${productId} with price: ${productPrice}`);
      } else {
        // Create a fallback product if none exist
        const newProduct = await productApi.createProduct({
          name: 'Cart Addition Test Product',
          description: 'Product for cart addition testing',
          price: 29.99,
          category: 'Test',
          inStock: true,
          image: 'http://example.com/image.jpg',
          dataAiHint: 'test'
        });
        const newBody = await newProduct.json();
        productId = newBody.id;
        productPrice = newBody.price;
        console.log(`Created new product: ${productId} with price: ${productPrice}`);
      }
      
      if (!productId) {
        throw new Error('Failed to set productId for tests');
      }
    } catch (error) {
      console.error('Error setup in beforeAll:', error);
      throw error;
    }
  });

  test.afterAll(async ({ cartApi }) => {
    try {
      // Cleanup: Clear cart after tests
      await cartApi.clearCart(testUserId);
    } catch (error) {
      console.error('Error cleanup in afterAll:', error);
      // Don't throw - cleanup errors shouldn't fail the suite
    }
  });

  test.beforeEach(async ({ cartApi }) => {
    try {
      // Clear cart before each test to avoid contamination from parallel runs
      await cartApi.clearCart(testUserId);
    } catch (error) {
      console.error('Error in beforeEach clear cart:', error);
      // Continue anyway - the test may still work with existing cart state
    }
  });

  test('should add item to cart with valid productId and quantity', async ({ cartApi }) => {
    try {
      if (!productId) {
        throw new Error('productId not set - beforeAll may have failed');
      }
      
      const quantity = 2;
      const response = await cartApi.addItem(testUserId, productId, quantity);
      
      try {
        expect(response.status()).toBe(200);
      } catch (e) {
        throw new Error(`Status check failed: expected 200, got ${response.status()}`);
      }
      
      const body = await response.json();
      
      try {
        expect(body).toBeDefined();
        expect(body.userId).toBe(testUserId);
        expect(body.items).toBeDefined();
        expect(Array.isArray(body.items)).toBeTruthy();
      } catch (e) {
        throw new Error(`Response structure invalid:\n${JSON.stringify(body)}`);
      }
      
      const addedItem = body.items.find((item: any) => item.id === productId);
      if (!addedItem) {
        throw new Error(`Item ${productId} not found in cart. Available items: ${JSON.stringify(body.items.map((i: any) => i.id))}`);
      }
      
      try {
        expect(addedItem.id).toBe(productId);
        expect(addedItem.quantity).toBe(quantity);
        expect(addedItem.price).toBeDefined();
        expect(addedItem.price).toBeGreaterThan(0);
      } catch (e) {
        throw new Error(`Item validation failed: ${JSON.stringify(addedItem)}`);
      }
      
      try {
        expect(body.totalAmount).toBeDefined();
        expect(typeof body.totalAmount).toBe('number');
        expect(body.totalAmount).toBeGreaterThan(0);
        
        const itemTotal = addedItem.price * quantity;
        expect(body.totalAmount).toBeGreaterThanOrEqual(itemTotal);
      } catch (e) {
        throw new Error(`Total amount invalid. Expected >= ${addedItem.price * quantity}, got ${body.totalAmount}`);
      }
      
    } catch (error) {
      throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test('should handle adding item with quantity of 1', async ({ cartApi }) => {
    try {
      const quantity = 1;
      const response = await cartApi.addItem(testUserId, productId, quantity);
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      const item = body.items.find((item: any) => item.id === productId);
      
      if (!item) throw new Error(`Item ${productId} not found in cart`);
      expect(item.quantity).toBeGreaterThanOrEqual(quantity);
      expect(body.totalAmount).toBeGreaterThanOrEqual(0);
      
    } catch (error) {
      throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test('should handle adding item with larger quantity', async ({ cartApi }) => {
    try {
      const quantity = 10;
      const response = await cartApi.addItem(testUserId, productId, quantity);
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      const item = body.items.find((item: any) => item.id === productId);
      
      if (!item) throw new Error(`Item ${productId} not found in cart`);
      expect(item.quantity).toBeGreaterThanOrEqual(quantity);
      expect(body.totalAmount).toBeGreaterThanOrEqual(0);
      
    } catch (error) {
      throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test.describe('Error Handling', () => {
    
    test('should return 400 for invalid product ID format', async ({ cartApi }) => {
      try {
        const response = await cartApi.addItem(testUserId, '', 1);
        
        // Should return 400 Bad Request for empty productId
        expect(response.status()).toBe(400);
        
        const body = await response.json();
        expect(body.error).toBeDefined();
        
      } catch (error) {
        throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    test('should return 400 for invalid quantity (negative)', async ({ cartApi }) => {
      try {
        const response = await cartApi.addItem(testUserId, productId, -1);
        
        // Should return 400 Bad Request for negative quantity
        expect(response.status()).toBe(400);
        
        const body = await response.json();
        expect(body.error).toBeDefined();
        
      } catch (error) {
        throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    test('should return 400 for invalid quantity (zero)', async ({ cartApi }) => {
      try {
        const response = await cartApi.addItem(testUserId, productId, 0);
        
        // Should return 400 Bad Request for zero quantity
        expect(response.status()).toBe(400);
        
        const body = await response.json();
        expect(body.error).toBeDefined();
        
      } catch (error) {
        throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    test('should handle non-existent product gracefully', async ({ cartApi }) => {
      try {
        const fakeProductId = 'non-existent-product-12345';
        const response = await cartApi.addItem(testUserId, fakeProductId, 1);
        
        // Should return 404 or 400 depending on service logic
        expect(response.status()).toBeGreaterThanOrEqual(400);
        
        const body = await response.json();
        expect(body.error).toBeDefined();
        
      } catch (error) {
        throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    test('should handle invalid user ID format', async ({ cartApi }) => {
      try {
        const response = await cartApi.addItem('', productId, 1);
        
        // Should return 400 or 404 for invalid userId
        expect(response.status()).toBeGreaterThanOrEqual(400);
        
      } catch (error) {
        throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  });

  test.describe('Response Body Validation', () => {
    
    test('should return complete cart object with all required fields', async ({ cartApi }) => {
      try {
        const response = await cartApi.addItem(testUserId, productId, 1);
        
        expect(response.status()).toBe(200);
        
        const body = await response.json();
        
        // Verify response includes all required fields
        expect(body.userId).toBeDefined();
        expect(body.items).toBeDefined();
        expect(body.totalAmount).toBeDefined();
        expect(body.totalItems).toBeDefined();
        expect(body.createdAt || body.updatedAt).toBeDefined();
        
        // Verify each item has required fields
        body.items.forEach((item: any) => {
          expect(item.id).toBeDefined();
          expect(item.quantity).toBeDefined();
          expect(item.price).toBeDefined();
          expect(typeof item.quantity).toBe('number');
          expect(typeof item.price).toBe('number');
        });
        
      } catch (error) {
        throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    test('should maintain cart integrity after addition', async ({ cartApi }) => {
      try {
        const response1 = await cartApi.addItem(testUserId, productId, 2);
        expect(response1.status()).toBe(200);
        
        const cart1 = await response1.json();
        const initialTotal = cart1.totalAmount;
        const foundItem = cart1.items.find((i: any) => i.id === productId);
        if (!foundItem) throw new Error(`Item ${productId} not found in cart`);
        const initialQuantity = foundItem.quantity;
        
        // Verify cart state is consistent
        expect(initialTotal).toBeGreaterThanOrEqual(0);
        expect(initialQuantity).toBeGreaterThan(0);
        
      } catch (error) {
        throw new Error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  });
});
