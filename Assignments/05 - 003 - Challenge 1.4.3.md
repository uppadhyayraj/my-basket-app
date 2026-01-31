# Challenge 1.4.3: Create Playwright Page Object Model

## Overview
This document details the implementation of the Page Object Model (POM) for the Home Page of the 'MyBasket' application. This change introduces a structured way to interact with the UI elements of the home page, enhancing test maintainability and readability.

## Changes Implemented

### 1. New Page Object File
**File Path**: `my-basket-api-tests/tests/pages/HomePage.ts`

A new TypeScript class `HomePage` has been created to encapsulate the behavior and locators of the application's landing page.

#### Key Components:
-   **Locators**:
    -   `productGrid`: Identifies the main container for products using the `.grid` CSS class.
    -   `cartIcon`: Locates the shopping cart button in the header using accessibility roles.
    -   `headerTitle`: Checks the page main heading "Welcome to MyBasket Lite!".
-   **Methods**:
    -   `goto()`: Navigates directly to the application root URL (`http://localhost:9002/`).
    -   `MapsTo()`: A verification method that asserts the user is on the correct page by checking the URL and visibility of key elements.
    -   `addProductToBasket(productName: string)`: A dynamic method that finds a product card by its text content and clicks the "Add to Cart" button within that specific card scope.
    -   `openCart()`: interactions with the cart icon to navigate to the cart page or open the modal.

## How It Works

The Page Object Model acts as an interface between the test scripts and the application UI. Instead of repeating complex locators in every test, tests can now use semantic methods.

### Example Usage

```typescript
import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('User can add item to basket', async ({ page }) => {
  // Initialize the Page Object
  const homePage = new HomePage(page);
  
  // Navigate to the page
  await homePage.goto();
  
  // Verify we are on the right page
  await homePage.MapsTo();
  
  // Perform actions using clean methods
  await homePage.addProductToBasket('Organic Apples');
  await homePage.openCart();
});
```

### Technical Details
-   **Locator Strategy**: We utilized `getByRole` where possible for better accessibility testing and resilience. For the product grid and cards, we combined CSS selectors with text filtering (`locator(..., { hasText: ... })`) to precisely target dynamic content.
-   **Verification**: The `MapsTo` method provides a quick "sanity check" to ensure the test context is correct before proceeding with actions.
