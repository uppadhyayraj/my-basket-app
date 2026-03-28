import { test, expect, BrowserContext, Page } from '@playwright/test';

// ─── Shared Test Configuration ─────────────────────────────────────────────────
const BASE_URL = 'http://localhost:9002';

// Generate a unique user for this test run using timestamp — ensures no conflicts
const timestamp = Date.now();
const testUser = {
  name: `Test User ${timestamp}`,
  email: `testuser${timestamp}@example.com`,
  username: `testuser${timestamp}`,
  password: `Pass${timestamp}!`,
};

// ─── Shared browser context and page across all serial tests ──────────────────
let context: BrowserContext;
let page: Page;

// ─── Full Shopping Journey (serial — each test builds on the previous) ─────────
test.describe.serial('MyBasket Lite — Full Shopping Journey', () => {
  test.beforeAll(async ({ browser }) => {
    // One context + page shared across all tests to preserve auth state
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1 — Registration
  // ─────────────────────────────────────────────────────────────────────────────
  test('1. Register a new unique user', async () => {
    await page.goto(`${BASE_URL}/register`);

    // Verify the registration page is displayed
    await expect(page).toHaveTitle('MyBasket Lite');
    // CardTitle renders as a <div> (not a heading), so use getByText
    await expect(page.getByText('Create Account').first()).toBeVisible();
    await expect(page.getByText('Sign up for a new MyBasket account')).toBeVisible();

    // Fill in all required registration fields
    await page.getByPlaceholder('Enter your full name').fill(testUser.name);
    await page.getByPlaceholder('Enter your email address').fill(testUser.email);
    await page.getByPlaceholder('Choose a username').fill(testUser.username);
    await page.getByPlaceholder('Create a password').fill(testUser.password);
    await page.getByPlaceholder('Confirm your password').fill(testUser.password);

    // Submit — the form's "Create Account" button (last one on the page, since header also has one)
    await page.locator('form').getByRole('button', { name: 'Create Account' }).click();

    // Successful registration redirects to the home page
    await expect(page).toHaveURL(`${BASE_URL}/`);

    // The header should now show the logged-in user's name
    await expect(page.getByText(testUser.name, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2 — Logout (sign out after registration so we can test explicit login)
  // ─────────────────────────────────────────────────────────────────────────────
  test('2. Sign out after registration', async () => {
    // Open the user dropdown in the header (button shows user's name)
    await page.getByRole('button', { name: new RegExp(testUser.name, 'i') }).click();

    // Click "Sign Out" from the dropdown
    await page.getByRole('menuitem', { name: 'Sign Out' }).click();

    // After sign-out, the header should show "Sign In" and "Create Account" again
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: 'Create Account' })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3 — Login
  // ─────────────────────────────────────────────────────────────────────────────
  test('3. Login with registered credentials', async () => {
    await page.goto(`${BASE_URL}/login`);

    // Verify the login page is displayed
    // CardTitle renders as a <div> (not a heading), so use getByText
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('Sign in to your MyBasket account')).toBeVisible();

    // Fill in login credentials
    await page.getByPlaceholder('Enter your username').fill(testUser.username);
    await page.getByPlaceholder('Enter your password').fill(testUser.password);

    // Submit — use the form's Sign In button
    await page.locator('form').getByRole('button', { name: 'Sign In' }).click();

    // Successful login redirects to home page
    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 10000 });

    // Verify user is logged in — header displays user name
    await expect(page.getByText(testUser.name, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4 — Product Search / Browse & Add to Cart
  // ─────────────────────────────────────────────────────────────────────────────
  test('4. Browse products, find an existing product, and add it to cart', async () => {
    // Navigate to the products listing page (home)
    await page.goto(`${BASE_URL}/`);

    // Verify the page heading
    await expect(page.getByRole('heading', { name: 'Welcome to MyBasket Lite!' })).toBeVisible();

    // Verify product grid appears with products (exact:true avoids strict-mode violation
    // when description text also contains these words)
    await expect(page.getByText('Organic Apples', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Whole Wheat Bread', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Free-Range Eggs', { exact: true }).first()).toBeVisible();

    // ── Find a specific existing product: "Organic Apples" ────────────────────
    // The product card is a .rounded-lg div containing the product name in a .font-semibold div
    const productCard = page.locator('.rounded-lg').filter({
      has: page.locator('.font-semibold', { hasText: 'Organic Apples' }),
    }).first();

    // Verify the product's details are shown
    await expect(productCard).toBeVisible();
    await expect(productCard.getByText('Crisp and juicy organic apples', { exact: false })).toBeVisible();
    await expect(productCard.getByText('$3.99')).toBeVisible();

    // Click "Add to Cart" for Organic Apples
    await productCard.getByRole('button', { name: 'Add to Cart' }).click();

    // Verify the success toast notification appears confirming the item was added
    // exact:true ensures we match only the small toast title div, not the ARIA status span
    await expect(page.getByText('Added to cart', { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Organic Apples has been added to your cart.', { exact: true })).toBeVisible({ timeout: 5000 });

    // Verify cart item badge appears in the header (any non-zero numeric badge)
    await expect(page.locator('header').locator('.rounded-full').filter({ hasText: /^\d+$/ })).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5 — View Cart
  // ─────────────────────────────────────────────────────────────────────────────
  test('5. View cart and verify the added product', async () => {
    await page.goto(`${BASE_URL}/cart`);

    // Verify the cart page heading
    await expect(page.getByRole('heading', { name: 'Your Shopping Cart' })).toBeVisible();

    // Verify "Organic Apples" appears in the cart
    await expect(page.getByText('Organic Apples')).toBeVisible({ timeout: 10000 });

    // Verify the order summary sidebar exists (CardTitle renders as div, not heading)
    await expect(page.getByText('Order Summary', { exact: true })).toBeVisible();

    // Verify the "Proceed to Checkout" button is available
    await expect(page.getByRole('link', { name: /Proceed to Checkout/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 6 — Checkout: Shipping Details
  // ─────────────────────────────────────────────────────────────────────────────
  test('6. Proceed to checkout and fill shipping details', async () => {
    // Click through to checkout from cart page
    await page.goto(`${BASE_URL}/cart`);
    await page.getByRole('link', { name: /Proceed to Checkout/i }).click();

    await expect(page).toHaveURL(`${BASE_URL}/checkout`, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();

    // Verify Step 1 (Shipping) is active — exact:true avoids matching the "Same as shipping address" label
    await expect(page.getByText('Shipping Address', { exact: true })).toBeVisible();

    // Fill shipping address fields (form IDs use "ship" as prefix)
    await page.locator('#ship-firstName').fill('Jane');
    await page.locator('#ship-lastName').fill('Doe');
    await page.locator('#ship-street').fill('123 Main Street');
    await page.locator('#ship-apartment').fill('Apt 4B');
    await page.locator('#ship-city').fill('San Francisco');
    await page.locator('#ship-state').fill('CA');
    await page.locator('#ship-zipCode').fill('94102');
    await page.locator('#ship-country').fill('United States');
    await page.locator('#ship-phone').fill('4155550100');

    // Keep "Standard Shipping" (already selected by default) and "Same as shipping address" checked
    await expect(page.locator('#standard')).toBeChecked();
    await expect(page.locator('#billing-same')).toBeChecked();

    // Click "Continue" to proceed to payment step
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify we moved to Step 2 (Payment)
    await expect(page.getByText('Payment Method')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 7 — Checkout: Payment Method
  // ─────────────────────────────────────────────────────────────────────────────
  test('7. Select Cash on Delivery as payment method', async () => {
    // We are already on Step 2 (Payment) from the previous test

    // Verify payment options are visible
    await expect(page.getByText('Credit Card')).toBeVisible();
    await expect(page.getByText('Cash on Delivery')).toBeVisible();

    // Select "Cash on Delivery" — no card details required
    await page.locator('#pm-cod').click();

    // Verify COD radio is selected
    await expect(page.locator('#pm-cod')).toBeChecked();

    // Click "Continue" to proceed to the Order Review step
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify we moved to Step 3 (Review)
    await expect(page.getByText(/Order Items/i)).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 8 — Checkout: Order Review & Place Order
  // ─────────────────────────────────────────────────────────────────────────────
  test('8. Review order and place it', async () => {
    // We are on Step 3 (Review)

    // Verify order review displays items (exact:true avoids matching the sidebar "Organic Apples × 1" span)
    await expect(page.getByText('Organic Apples', { exact: true }).first()).toBeVisible();

    // Verify shipping details are summarised correctly
    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText('123 Main Street', { exact: false })).toBeVisible();
    await expect(page.getByText('San Francisco', { exact: false })).toBeVisible();

    // Verify payment method shown as "Cash on Delivery"
    await expect(page.getByText('Cash on Delivery')).toBeVisible();

    // Verify order total is shown in the sidebar
    await expect(page.getByText('Total').last()).toBeVisible();

    // Place the order — button label is dynamic: "Place Order — $X.XX"
    const placeOrderBtn = page.getByRole('button', { name: /Place Order/i });
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // Verify the order confirmation screen appears
    await expect(page.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Thank you for your purchase')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 9 — Confirm Order in Order History
  // ─────────────────────────────────────────────────────────────────────────────
  test('9. Navigate to order history and confirm the order is listed', async () => {
    // Click "View My Orders" on the confirmation screen
    await page.getByRole('link', { name: 'View My Orders' }).click();

    await expect(page).toHaveURL(`${BASE_URL}/orders`, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Your Orders' })).toBeVisible();

    // At least one order should appear in the list
    await expect(page.locator('.rounded-lg.bg-card').first()).toBeVisible({ timeout: 10000 });

    // Verify a "View" details button/link is present for the order
    await expect(page.getByRole('link', { name: /View/i }).first()).toBeVisible();

    // Confirm the order status badge is shown (pending or confirmed after placement)
    await expect(page.getByText(/pending|confirmed/i).first()).toBeVisible();

    // Verify the order total is displayed (Organic Apples $3.99 + 8% tax = ~$4.31)
    await expect(page.getByText(/\$\d+\.\d{2}/, { exact: false }).first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 10 — Logout
  // ─────────────────────────────────────────────────────────────────────────────
  test('10. Log out of the application', async () => {
    // Open the user dropdown menu in the header
    await page.getByRole('button', { name: new RegExp(testUser.name, 'i') }).click();

    // Verify the dropdown contains expected items
    await expect(page.getByRole('menuitem', { name: 'Account Settings' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'My Orders' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Sign Out' })).toBeVisible();

    // Click "Sign Out"
    await page.getByRole('menuitem', { name: 'Sign Out' }).click();

    // Verify user is logged out — header shows guest navigation
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: 'Create Account' })).toBeVisible();

    // Verify user name is no longer visible in the header
    await expect(page.getByText(testUser.name, { exact: false })).not.toBeVisible();

    // Verify attempting to access a protected route redirects to login
    await page.goto(`${BASE_URL}/cart`);
    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10000 });
  });
});

// ─── Standalone Tests (can run independently) ─────────────────────────────────

test.describe('MyBasket Lite — Registration Validation', () => {
  test('Registration fails when passwords do not match', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    const ts = Date.now();
    await page.getByPlaceholder('Enter your full name').fill(`Mismatch User ${ts}`);
    await page.getByPlaceholder('Enter your email address').fill(`mismatch${ts}@example.com`);
    await page.getByPlaceholder('Choose a username').fill(`mismatch${ts}`);
    await page.getByPlaceholder('Create a password').fill('Password123!');
    await page.getByPlaceholder('Confirm your password').fill('DifferentPass456!');

    await page.locator('form').getByRole('button', { name: 'Create Account' }).click();

    // Error message should be displayed
    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 5000 });

    // Should remain on the registration page
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

  test('Registration fails when required fields are empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    // Submit without filling any fields
    await page.locator('form').getByRole('button', { name: 'Create Account' }).click();

    // An error message should be shown
    await expect(page.getByText(/required|fill in/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('MyBasket Lite — Login Validation', () => {
  test('Login fails with incorrect credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.getByPlaceholder('Enter your username').fill('nonexistentuser99999');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');

    await page.locator('form').getByRole('button', { name: 'Sign In' }).click();

    // An error message should appear
    await expect(page.getByText(/invalid|failed|incorrect|not found/i)).toBeVisible({ timeout: 8000 });

    // Should remain on the login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('Login page redirects authenticated users to home', async ({ browser }) => {
    // Register a fresh user and verify redirect
    const freshCtx = await browser.newContext();
    const freshPage = await freshCtx.newPage();

    try {
      const ts2 = Date.now();
      await freshPage.goto(`${BASE_URL}/register`);
      await freshPage.getByPlaceholder('Enter your full name').fill(`Redirect User ${ts2}`);
      await freshPage.getByPlaceholder('Enter your email address').fill(`redirect${ts2}@example.com`);
      await freshPage.getByPlaceholder('Choose a username').fill(`redirect${ts2}`);
      await freshPage.getByPlaceholder('Create a password').fill('Pass1234!');
      await freshPage.getByPlaceholder('Confirm your password').fill('Pass1234!');
      await freshPage.locator('form').getByRole('button', { name: 'Create Account' }).click();

      // After login, visiting /login should redirect back to /
      await freshPage.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
      await freshPage.goto(`${BASE_URL}/login`);
      await expect(freshPage).toHaveURL(`${BASE_URL}/`, { timeout: 5000 });
    } finally {
      await freshCtx.close();
    }
  });
});

test.describe('MyBasket Lite — Protected Routes', () => {
  test('Cart page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10000 });
  });

  test('Checkout page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10000 });
  });

  test('Orders page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10000 });
  });
});
