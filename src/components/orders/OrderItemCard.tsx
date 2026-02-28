import type { Order, CartItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface OrderItemCardProps {
  order: Order;
}

export function OrderItemCard({ order }: OrderItemCardProps) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    processing: "bg-indigo-100 text-indigo-800 border-indigo-300",
    shipped: "bg-purple-100 text-purple-800 border-purple-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    refunded: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const badgeClass = statusColor[order.status?.toLowerCase()] || "bg-secondary text-secondary-foreground";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      {/* Order # */}
      <div className="min-w-[120px]">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Order</p>
        <p className="font-semibold text-foreground">#{order.id.substring(0, 8)}</p>
      </div>

      {/* Date */}
      <div className="min-w-[130px]">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
        <p className="text-sm text-foreground">
          {new Date(order.orderDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Status */}
      <div className="min-w-[100px]">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
        <Badge variant="outline" className={`capitalize text-xs mt-0.5 ${badgeClass}`}>
          {order.status}
        </Badge>
      </div>

      {/* Items count */}
      <div className="min-w-[70px] text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Items</p>
        <p className="text-sm font-medium text-foreground">{totalItems}</p>
      </div>

      {/* Total */}
      <div className="min-w-[90px] text-right">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
        <p className="text-sm font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
      </div>

      {/* View Details link */}
      <div className="sm:ml-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/orders/${order.id}`}>
            View <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
