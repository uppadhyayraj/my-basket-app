import { type Page, type Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly cartIcon: Locator;
  readonly toastContainer_Success: Locator;
  readonly toastContainer_Error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartIcon = page.getByRole('button', { name: /Shopping Cart/i });
    this.toastContainer_Success = page.getByRole('status').filter({ hasText: /Added to cart|Item removed/i });
    this.toastContainer_Error = page.getByRole('status').filter({ hasText: /Error/i });
  }

  async openCart() {
    await this.cartIcon.click();
  }

  async verifyToastVisible(message: string | RegExp) {
    const toast = this.page.getByText(message);
    await expect(toast).toBeVisible();
  }

  async setUserId(userId: string) {
    await this.page.addInitScript((id) => {
      window.localStorage.setItem('demo_user_id', id);
    }, userId);
  }
}
