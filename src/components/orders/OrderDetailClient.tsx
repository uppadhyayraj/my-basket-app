"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getUserId, isLoggedIn } from "@/lib/session";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, CartItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, Package } from "lucide-react";

interface OrderDetailClientProps {
  orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn: authLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!authLoggedIn) {
      router.replace("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const userId = getUserId();
        const data = await apiClient.getOrder(userId, orderId) as Order;
        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, authLoggedIn, authLoading]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || "Order not found"}</p>
        <Button asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Link>
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl">Order #{order.id.substring(0, 8)}</CardTitle>
              <CardDescription className="mt-1">
                Placed on{" "}
                {new Date(order.orderDate).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                {order.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 text-center bg-muted/40 rounded-lg p-4">
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="text-lg font-bold text-foreground">{totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-bold capitalize text-foreground">{order.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          {/* Items list */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-foreground">Order Items</h3>
            <ul className="space-y-3">
              {order.items.map((item: CartItem) => (
                <li key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                  <div className="flex items-center space-x-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        data-ai-hint={item.dataAiHint}
                      />
                    </div>
                    <div>
                      <span className="font-medium text-sm text-foreground">{item.name}</span>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Price breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>Free</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Shipping & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm mb-2 text-foreground">Shipping Address</h3>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 text-foreground">Billing Address</h3>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{order.billingAddress.street}</p>
                <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}</p>
                <p>{order.billingAddress.country}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2 text-foreground">Payment Method</h3>
            <div className="text-sm text-muted-foreground">
              <p className="capitalize">{order.paymentMethod.brand || order.paymentMethod.type.replace(/_/g, ' ')}{order.paymentMethod.last4 ? ` ending in ${order.paymentMethod.last4}` : ''}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 rounded-b-lg p-4">
          <div className="w-full flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
