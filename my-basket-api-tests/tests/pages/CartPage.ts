import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly emptyCartMessage: Locator;
  readonly emptyCartSubtext: Locator;
  readonly startShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emptyCartMessage = page.getByRole('heading', { name: 'Your cart is empty' });
    this.emptyCartSubtext = page.getByText('Looks like you haven\'t added anything to your cart yet.');
    this.startShoppingButton = page.getByRole('link', { name: 'Start Shopping' });
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async verifyEmptyState() {
    await expect(this.emptyCartMessage).toBeVisible();
    await expect(this.emptyCartSubtext).toBeVisible();
    await expect(this.startShoppingButton).toBeVisible();
  }

  async verifyItemVisible(productName: string) {
    const cartItem = this.page.getByRole('heading', { name: productName }).first();
    await expect(cartItem).toBeVisible();
  }

  async removeItem(productName: string) {
    // Locate the container that has the product heading and the remove button
    const cartItem = this.page.locator('div')
      .filter({ has: this.page.getByRole('heading', { name: productName }) })
      .getByRole('button', { name: /Remove item/i })
      .first();
    await cartItem.click();
  }
}
