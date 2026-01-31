# Challenge 1.4.4: Add to Cart UI Test

## Overview
This document details the addition of a UI verification test for adding products to the basket. We also updated the Page Object Model and Playwright configuration to support this test.

## Changes Implemented

### 1. Updated `HomePage.ts`
**File Path**: `my-basket-api-tests/tests/pages/HomePage.ts`
- Added `addFirstProductToBasket()` method. This helper method finds the first product card in the grid and clicks its "Add to Cart" button, providing a stable way to test the "add generic item" flow without relying on specific product names.

### 2. New UI Test
**File Path**: `my-basket-api-tests/tests/integration/ui-add-to-cart.spec.ts`
- **Objective**: Verify that a user can add a product to the cart and see the success toast.
- **Mocking**: The test mocks the API endpoints (`/api/cart/*`) to ensure the UI can be tested independently of backend service availability.
- **Steps**:
    1.  Navigate to Home Page.
    2.  Click "Add to Cart" on the first listed product.
    3.  Assert that the "Added to cart" toast notification appears.

### 3. Configuration Update
**File Path**: `my-basket-api-tests/playwright.config.ts`
- Added `screenshot: 'only-on-failure'` to the configuration. This ensures that if a UI test fails, a screenshot is automatically captured and attached to the report, significantly aiding in debugging.

## How It Works

The test uses the Mock Service Worker pattern (via Playwright's `page.route`) to intercept network requests. When the application tries to call the backend Cart Service, Playwright responds with a pre-defined success JSON. This allows us to verify that the **Frontend** correctly shows the "Added to cart" toast when it receives a 200 OK response, regardless of whether the real backend is running.

### Example Usage

```typescript
// From tests/integration/ui-add-to-cart.spec.ts
await test.step('Add first product to cart', async () => {
  await homePage.addFirstProductToBasket();
});

await test.step('Verify "Item added" toast appears', async () => {
  const toast = page.getByText('Added to cart');
  await expect(toast).toBeVisible({ timeout: 5000 });
});
```
