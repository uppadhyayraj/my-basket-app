import { Order, OrderStatus, CreateOrderRequest, UpdateOrderStatusRequest, OrderFilters, PaginationParams, OrderResponse } from './types';
import { CartServiceClient } from './cart-client';
import { v4 as uuidv4 } from 'uuid';

export class OrderService {
  private orders: Map<string, Order[]> = new Map(); // userId -> orders
  private cartClient: CartServiceClient;

  constructor() {
    this.cartClient = new CartServiceClient();
  }

  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Fetch authoritative cart for data-integrity checks
    const cart = await this.cartClient.getCart(userId).catch(() => null);
    const cartItems: { id?: string; price: number; quantity: number }[] = (cart && cart.items) || [];

    // Validate items and compute totals in cents to avoid floating point issues
    const orderTotalCents = orderData.items.reduce((total, item) => {
      if (item.quantity <= 0) throw new Error('Item quantity must be > 0');
      if (item.price < 0) throw new Error('Item price must be >= 0');
      const priceCents = Math.round(item.price * 100);
      return total + priceCents * item.quantity;
    }, 0);

    // If cart present, compute cart total in cents and compare
    if (cartItems.length > 0) {
      const cartTotalCents = cartItems.reduce((total, item) => {
        const priceCents = Math.round((item.price || 0) * 100);
        return total + priceCents * (item.quantity || 0);
      }, 0);

      if (cartTotalCents !== orderTotalCents) {
        throw new Error('Data integrity check failed: order total does not match cart total');
      }

      // Item-level consistency: ensure each order item matches a cart item by id/price/quantity
      for (const oItem of orderData.items) {
        const matching = cartItems.find(c => String(c.id) === String(oItem.id));
        if (!matching) {
          throw new Error('Data integrity check failed: order item not found in cart');
        }
        const matchingPriceCents = Math.round((matching.price || 0) * 100);
        const oPriceCents = Math.round((oItem.price || 0) * 100);
        if (matchingPriceCents !== oPriceCents || (matching.quantity || 0) !== oItem.quantity) {
          throw new Error('Data integrity check failed: order item mismatch with cart item');
        }
      }
    }

    const totalAmount = orderTotalCents / 100;

    const order: Order = {
      id: uuidv4(),
      userId,
      items: orderData.items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: OrderStatus.PENDING,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod,
      orderDate: new Date(),
      estimatedDelivery: this.calculateEstimatedDelivery(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userOrders = this.orders.get(userId) || [];
    userOrders.unshift(order); // Add to beginning for newest first
    this.orders.set(userId, userOrders);

    // Clear the user's cart after successful order creation
    try {
      await this.cartClient.clearCart(userId);
    } catch (error) {
      // rollback in-memory order on cart-clear failure to preserve consistency
      const remaining = (this.orders.get(userId) || []).filter(o => o.id !== order.id);
      this.orders.set(userId, remaining);
      console.warn('Failed to clear cart after order creation, rolled back order:', error);
      throw new Error('Failed to clear cart after order creation');
    }

    return order;
  }

  async getOrderById(userId: string, orderId: string): Promise<Order | null> {
    const userOrders = this.orders.get(userId) || [];
    return userOrders.find(order => order.id === orderId) || null;
  }

  async getUserOrders(
    userId: string,
    filters?: OrderFilters,
    pagination?: PaginationParams
  ): Promise<OrderResponse> {
    let userOrders = this.orders.get(userId) || [];

    // Apply filters
    if (filters) {
      if (filters.status) {
        userOrders = userOrders.filter(order => order.status === filters.status);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        userOrders = userOrders.filter(order => order.orderDate >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        userOrders = userOrders.filter(order => order.orderDate <= endDate);
      }
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedOrders = userOrders.slice(startIndex, endIndex);
    const totalPages = Math.ceil(userOrders.length / limit);

    return {
      orders: paginatedOrders,
      total: userOrders.length,
      page,
      limit,
      totalPages,
    };
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    updateData: UpdateOrderStatusRequest
  ): Promise<Order | null> {
    const userOrders = this.orders.get(userId) || [];
    const orderIndex = userOrders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return null;
    }

    const order = userOrders[orderIndex];
    
    // Validate status transition
    if (!this.isValidStatusTransition(order.status, updateData.status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${updateData.status}`);
    }

    order.status = updateData.status;
    order.updatedAt = new Date();

    if (updateData.trackingNumber) {
      order.trackingNumber = updateData.trackingNumber;
    }

    if (updateData.estimatedDelivery) {
      order.estimatedDelivery = new Date(updateData.estimatedDelivery);
    }

    if (updateData.actualDelivery) {
      order.actualDelivery = new Date(updateData.actualDelivery);
    }

    this.orders.set(userId, userOrders);
    return order;
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order | null> {
    const userOrders = this.orders.get(userId) || [];
    const orderIndex = userOrders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return null;
    }

    const order = userOrders[orderIndex];

    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel order that has already been shipped or delivered');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error('Order is already cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();

    this.orders.set(userId, userOrders);
    return order;
  }

  private calculateEstimatedDelivery(): Date {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from now
    return deliveryDate;
  }

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
