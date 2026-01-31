import { type Page, type Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly productGrid: Locator;
  readonly cartIcon: Locator;
  readonly headerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use main role instead of css class .grid
    this.productGrid = page.getByRole('main'); 
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
    // Locate the specific "Add to Cart" button that is associated with the product name.
    // We find the container (card) that has both the product name and the button.
    const productCard = this.page.locator('div')
      .filter({ has: this.page.getByText(productName, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: /Add to Cart/i }) })
      .first();
    
    const addToCartButton = productCard.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    // Optional: Wait for "Adding..." state to disappear or toast to appear if we wanted strict verification here
    // But basic action is just the click.
  }

  async addFirstProductToBasket() {
    // Select the first "Add to Cart" button found in the main product grid
    const addToCartButtons = this.productGrid.getByRole('button', { name: /Add to Cart/i });
    await addToCartButtons.first().click();
  }

  async openCart() {
    await this.cartIcon.click();
  }
}
