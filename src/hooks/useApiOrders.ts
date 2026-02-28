"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { getUserId } from "@/lib/session";
import { useAuth } from "@/contexts/AuthContext";
import type { Order } from "@/lib/types";

export const useApiOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();

  const fetchOrders = async () => {
    const userId = getUserId();
    if (!userId) {
      setOrders([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const ordersData = await apiClient.getOrders(userId) as { orders: Order[] };
      setOrders(ordersData.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when user changes
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [isLoggedIn, user?.id]);

  return {
    orders,
    loading,
    error,
    refreshOrders: fetchOrders,
  };
};
