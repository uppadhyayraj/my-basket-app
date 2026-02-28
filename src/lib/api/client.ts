const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body.error || body.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Cart methods
  async addToCart(userId: string, productId: string, quantity: number = 1) {
    return this.post(`/api/cart/${userId}/items`, { productId, quantity });
  }

  async getCart(userId: string) {
    return this.get(`/api/cart/${userId}`);
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    return this.put(`/api/cart/${userId}/items/${productId}`, { quantity });
  }

  async removeFromCart(userId: string, productId: string) {
    return this.delete(`/api/cart/${userId}/items/${productId}`);
  }

  async clearCart(userId: string) {
    return this.delete(`/api/cart/${userId}`);
  }

  // Product methods
  async getProducts(limit?: number, page?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (page) params.append('page', page.toString());
    return this.get(`/api/products?${params.toString()}`);
  }

  async getProduct(id: string) {
    return this.get(`/api/products/${id}`);
  }

  // Order methods
  async getOrders(userId: string) {
    return this.get(`/api/orders/${userId}`);
  }

  async getOrder(userId: string, orderId: string) {
    return this.get(`/api/orders/${userId}/${orderId}`);
  }

  async createOrder(userId: string, orderData: {
    items: any[];
    shippingAddress: { street: string; city: string; state: string; zipCode: string; country: string };
    billingAddress: { street: string; city: string; state: string; zipCode: string; country: string };
    paymentMethod: { type: string; last4?: string; brand?: string };
  }) {
    return this.post(`/api/orders/${userId}`, orderData);
  }

  // Auth / User methods
  async login(username: string, password: string) {
    return this.post('/api/users/login', { username, password });
  }

  async register(username: string, password: string, name: string, email: string) {
    return this.post('/api/users/register', { username, password, name, email });
  }

  async updateUser(userId: string, data: { name?: string; email?: string; password?: string }) {
    return this.put(`/api/users/${userId}`, data);
  }

  async deleteUser(userId: string) {
    return this.delete(`/api/users/${userId}`);
  }

  // AI methods
  async getGrocerySuggestions(cartItems: string[]) {
    return this.post(`/api/recommendations/grocery-suggestions`, { cartItems });
  }

  async getPersonalizedRecommendations(cartItems: string[], userId?: string, maxSuggestions?: number) {
    return this.post(`/api/recommendations/personalized`, { cartItems, userId, maxSuggestions });
  }
}

export const apiClient = new ApiClient();
