import { type Page, type Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly emptyCartMessage: Locator;
  readonly emptyCartSubtext: Locator;
  readonly startShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyCartMessage = page.getByRole('heading', { name: 'Your cart is empty' });
    this.emptyCartSubtext = page.getByText('Looks like you haven\'t added anything to your cart yet.');
    this.startShoppingButton = page.getByRole('link', { name: 'Start Shopping' });
  }

  async goto() {
    await this.page.goto('http://localhost:9002/cart');
  }

  async verifyEmptyState() {
    await expect(this.emptyCartMessage).toBeVisible();
    await expect(this.emptyCartSubtext).toBeVisible();
    await expect(this.startShoppingButton).toBeVisible();
  }

  async setUserId(userId: string) {
    await this.page.addInitScript((id) => {
      window.localStorage.setItem('demo_user_id', id);
    }, userId);
  }

  async verifyItemVisible(productName: string) {
    await expect(this.page.getByRole('heading', { name: productName })).toBeVisible();
  }
}
