import axios from 'axios';

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3000';

export class CartServiceClient {
  async clearCart(userId: string): Promise<void> {
    // Test-only simulation: if userId starts with 'fail-clear', simulate a failure
    if (userId && userId.startsWith('fail-clear')) {
      console.error('Simulating clearCart failure for userId:', userId);
      throw new Error('Simulated clearCart failure for testing');
    }

    try {
      console.info('[CartServiceClient] clearCart calling:', `${CART_SERVICE_URL}/api/cart/${userId}`);
      await axios.delete(`${CART_SERVICE_URL}/api/cart/${userId}`);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error('Failed to clear cart');
    }
  }

  async getCart(userId: string): Promise<any> {
    try {
      console.info('[CartServiceClient] getCart calling:', `${CART_SERVICE_URL}/api/cart/${userId}`);
      const response = await axios.get(`${CART_SERVICE_URL}/api/cart/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error('Failed to fetch cart');
    }
  }
}
