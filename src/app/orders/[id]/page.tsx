import { OrderDetailClient } from "@/components/orders/OrderDetailClient";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <OrderDetailClient orderId={id} />
    </div>
  );
}
