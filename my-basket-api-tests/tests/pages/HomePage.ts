import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly productGrid: Locator;
  readonly headerTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.productGrid = page.getByRole('main'); 
    this.headerTitle = page.getByRole('heading', { name: 'Welcome to MyBasket Lite!' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async verifyPageLoaded() {
    await expect(this.headerTitle).toBeVisible();
    await expect(this.productGrid).toBeVisible();
    // Wait for at least one product card button to appear
    await expect(this.page.getByRole('button', { name: /Add to Cart/i }).first()).toBeVisible();
  }
  
  async addProductToBasket(productName: string) {
    // Find the button within the context that has the product name
    const productButton = this.page.locator('div')
      .filter({ has: this.page.getByRole('heading', { name: productName }) })
      .getByRole('button', { name: /Add to Cart/i })
      .first();
    
    await productButton.click();
  }

  async addFirstProductToBasket() {
    await this.page.getByRole('button', { name: /Add to Cart/i }).first().click();
  }
}
