export interface Product {
  id: string;
  name: string;
  price: number;
  discount?: number; // Percentage discount (0.00 – 100.00), up to two decimal places
  description: string;
  image: string;
  dataAiHint: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: string;
  orderDate: string;
  estimatedDelivery?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  createdAt: string;
  updatedAt: string;
}
