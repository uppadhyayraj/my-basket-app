import { type Page, type Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly productGrid: Locator;
  readonly cartIcon: Locator;
  readonly headerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productGrid = page.locator('.grid'); // Matches the grid class in ProductList.tsx
    // The cart button is inside a Link to /cart, and has "Shopping Cart" screen reader text
    this.cartIcon = page.getByRole('button', { name: /Shopping Cart/i });
    this.headerTitle = page.getByRole('heading', { name: 'Welcome to MyBasket Lite!' });
  }

  async goto() {
    await this.page.goto('http://localhost:9002/');
  }

  async MapsTo() {
    await expect(this.page).toHaveURL('http://localhost:9002/');
    await expect(this.headerTitle).toBeVisible();
    await expect(this.productGrid).toBeVisible();
  }

  async addProductToBasket(productName: string) {
    // Locate the card containing the product name, then find the 'Add to Cart' button within it
    // We use a broader locator to find the card based on text, then narrow down
    const productCard = this.page.locator('.rounded-lg', { hasText: productName }); 
    // We can also be more specific if structure allows, but hasText is robust here
    
    const addToCartButton = productCard.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    // Optional: Wait for "Adding..." state to disappear or toast to appear if we wanted strict verification here
    // But basic action is just the click.
  }

  async addFirstProductToBasket() {
    // Select the first product card in the grid
    const firstProductCard = this.productGrid.locator('.rounded-lg').first();
    const addToCartButton = firstProductCard.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
  }

  async openCart() {
    await this.cartIcon.click();
  }
}
