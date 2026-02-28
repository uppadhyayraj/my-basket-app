"use client";

import { useCart } from "@/contexts/ApiCartContext";
import type { CartItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  CheckCircle,
  Loader2,
  MapPin,
  CreditCard,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Lock,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getUserId } from "@/lib/session";

// ─── Types ───────────────────────────────────────────────────
interface Address {
  firstName: string;
  lastName: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface PaymentInfo {
  method: "credit_card" | "debit_card" | "cod";
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

const EMPTY_ADDRESS: Address = {
  firstName: "",
  lastName: "",
  street: "",
  apartment: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  phone: "",
};

const STEPS = [
  { id: 1, label: "Shipping", icon: MapPin },
  { id: 2, label: "Payment", icon: CreditCard },
  { id: 3, label: "Review", icon: ClipboardList },
] as const;

// ─── Step Indicator ──────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isDone = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`hidden sm:inline text-sm font-medium ${
                  isActive
                    ? "text-primary"
                    : isDone
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-16 transition-colors ${
                  currentStep > step.id ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function OrderReviewClient() {
  const {
    items,
    totalAmount: cartTotalAmount,
    clearCart,
    loading,
    error,
  } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [shippingAttempted, setShippingAttempted] = useState(false);
  const [paymentAttempted, setPaymentAttempted] = useState(false);

  // Shipping state
  const [shippingAddress, setShippingAddress] =
    useState<Address>(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = useState<Address>(EMPTY_ADDRESS);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );

  // Payment state
  const [payment, setPayment] = useState<PaymentInfo>({
    method: "credit_card",
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  // ─── Helpers ────────────────────────────────────────────────
  const shippingCost = shippingMethod === "express" ? 9.99 : 0;
  const tax = Math.round(cartTotalAmount * 0.08 * 100) / 100; // 8 % tax
  const orderTotal =
    Math.round((cartTotalAmount + shippingCost + tax) * 100) / 100;

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const updateShipping = (field: keyof Address, value: string) =>
    setShippingAddress((prev) => ({ ...prev, [field]: value }));

  const updateBilling = (field: keyof Address, value: string) =>
    setBillingAddress((prev) => ({ ...prev, [field]: value }));

  // ─── Validation ─────────────────────────────────────────────
  const validateShipping = (): boolean => {
    setShippingAttempted(true);
    const a = shippingAddress;
    if (
      !a.firstName ||
      !a.lastName ||
      !a.street ||
      !a.city ||
      !a.state ||
      !a.zipCode ||
      !a.country ||
      !a.phone
    ) {
      setFormError("Please fill in all required shipping fields.");
      return false;
    }
    if (!billingSameAsShipping) {
      const b = billingAddress;
      if (
        !b.firstName ||
        !b.lastName ||
        !b.street ||
        !b.city ||
        !b.state ||
        !b.zipCode
      ) {
        setFormError("Please fill in all required billing fields.");
        return false;
      }
    }
    setFormError(null);
    return true;
  };

  const validatePayment = (): boolean => {
    setPaymentAttempted(true);
    if (payment.method === "cod") {
      setFormError(null);
      return true;
    }
    const digits = payment.cardNumber.replace(/\s/g, "");
    if (digits.length < 13) {
      setFormError("Please enter a valid card number.");
      return false;
    }
    if (!payment.cardName.trim()) {
      setFormError("Please enter the name on card.");
      return false;
    }
    if (payment.expiry.length < 5) {
      setFormError("Please enter a valid expiry date (MM/YY).");
      return false;
    }
    if (payment.cvv.length < 3) {
      setFormError("Please enter a valid CVV.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateShipping()) return;
    if (step === 2 && !validatePayment()) return;
    setFormError(null);
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setFormError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  // ─── Place Order ────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!items || items.length === 0) return;

    try {
      setIsPlacingOrder(true);
      const userId = getUserId();
      const resolvedBilling = billingSameAsShipping
        ? shippingAddress
        : billingAddress;
      const cardDigits = payment.cardNumber.replace(/\s/g, "");
      const last4 = cardDigits.slice(-4);

      await apiClient.createOrder(userId, {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          image: item.image,
          dataAiHint: item.dataAiHint,
          quantity: item.quantity,
        })),
        shippingAddress: {
          street: `${shippingAddress.street}${
            shippingAddress.apartment
              ? `, ${shippingAddress.apartment}`
              : ""
          }`,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
        billingAddress: {
          street: `${resolvedBilling.street}${
            resolvedBilling.apartment
              ? `, ${resolvedBilling.apartment}`
              : ""
          }`,
          city: resolvedBilling.city,
          state: resolvedBilling.state,
          zipCode: resolvedBilling.zipCode,
          country: resolvedBilling.country,
        },
        paymentMethod: {
          type: payment.method,
          last4: payment.method === "cod" ? undefined : last4,
          brand:
            payment.method === "cod"
              ? "Cash on Delivery"
              : payment.method === "debit_card"
              ? "Debit Card"
              : "Credit Card",
        },
      });

      await clearCart();
      setIsOrderPlaced(true);
      toast({
        title: "Order placed successfully!",
        description:
          "Your order has been confirmed and you will receive a confirmation email.",
      });
    } catch (err) {
      console.error("Error placing order:", err);
      toast({
        title: "Error placing order",
        description:
          "There was a problem placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ─── Loading / Error / Empty / Success States ──────────────
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Error loading cart: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center text-center">
        <div className="rounded-full bg-green-100 p-4 mb-6">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground mb-2 max-w-md">
          Thank you for your purchase. Your order has been placed and is being
          processed.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Estimated delivery:{" "}
          <span className="font-medium text-foreground">
            {shippingMethod === "express"
              ? "2–3 business days"
              : "5–7 business days"}
          </span>
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/orders">View My Orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground mb-6">
          Add items to your cart to proceed with checkout.
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const errCls = "border-destructive focus-visible:ring-destructive";

  // ─── Address Fields Helper ─────────────────────────────────
  const renderAddressFields = (
    addr: Address,
    onChange: (field: keyof Address, value: string) => void,
    prefix: string
  ) => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-firstName`}>First Name <span className="text-destructive">*</span></Label>
          <Input
            id={`${prefix}-firstName`}
            placeholder="Enter first name"
            value={addr.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            className={shippingAttempted && !addr.firstName ? errCls : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-lastName`}>Last Name <span className="text-destructive">*</span></Label>
          <Input
            id={`${prefix}-lastName`}
            placeholder="Enter last name"
            value={addr.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            className={shippingAttempted && !addr.lastName ? errCls : ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-street`}>Street Address <span className="text-destructive">*</span></Label>
        <Input
          id={`${prefix}-street`}
          placeholder="Enter street address"
          value={addr.street}
          onChange={(e) => onChange("street", e.target.value)}
          className={shippingAttempted && !addr.street ? errCls : ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-apartment`}>
          Apartment / Suite (optional)
        </Label>
        <Input
          id={`${prefix}-apartment`}
          placeholder="Apt, suite, unit (optional)"
          value={addr.apartment}
          onChange={(e) => onChange("apartment", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-city`}>City <span className="text-destructive">*</span></Label>
          <Input
            id={`${prefix}-city`}
            placeholder="Enter city"
            value={addr.city}
            onChange={(e) => onChange("city", e.target.value)}
            className={shippingAttempted && !addr.city ? errCls : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-state`}>State <span className="text-destructive">*</span></Label>
          <Input
            id={`${prefix}-state`}
            placeholder="Enter state"
            value={addr.state}
            onChange={(e) => onChange("state", e.target.value)}
            className={shippingAttempted && !addr.state ? errCls : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-zipCode`}>Zip Code <span className="text-destructive">*</span></Label>
          <Input
            id={`${prefix}-zipCode`}
            placeholder="Zip code"
            value={addr.zipCode}
            onChange={(e) => onChange("zipCode", e.target.value)}
            className={shippingAttempted && !addr.zipCode ? errCls : ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-country`}>Country <span className="text-destructive">*</span></Label>
          <Input
            id={`${prefix}-country`}
            placeholder="Enter country"
            value={addr.country}
            onChange={(e) => onChange("country", e.target.value)}
            className={shippingAttempted && !addr.country ? errCls : ""}
          />
        </div>
        {prefix === "ship" && (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-phone`}>Phone <span className="text-destructive">*</span></Label>
            <Input
              id={`${prefix}-phone`}
              type="tel"
              placeholder="Enter phone number"
              value={addr.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className={shippingAttempted && !addr.phone ? errCls : ""}
            />
          </div>
        )}
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Form Area ─────────────────────────────── */}
        <div className="lg:col-span-2">
          {formError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          {/* STEP 1 — Shipping */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                  <CardDescription>
                    Where should we deliver your order?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAddressFields(
                    shippingAddress,
                    updateShipping,
                    "ship"
                  )}
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={shippingMethod}
                    onValueChange={(v) =>
                      setShippingMethod(v as "standard" | "express")
                    }
                    className="space-y-3"
                  >
                    <label
                      htmlFor="standard"
                      className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                        shippingMethod === "standard"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="standard" id="standard" />
                        <div>
                          <p className="font-medium">Standard Shipping</p>
                          <p className="text-sm text-muted-foreground">
                            5–7 business days
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">Free</span>
                    </label>
                    <label
                      htmlFor="express"
                      className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                        shippingMethod === "express"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="express" id="express" />
                        <div>
                          <p className="font-medium">Express Shipping</p>
                          <p className="text-sm text-muted-foreground">
                            2–3 business days
                          </p>
                        </div>
                      </div>
                      <span className="font-bold">$9.99</span>
                    </label>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="billing-same"
                      checked={billingSameAsShipping}
                      onCheckedChange={(checked) =>
                        setBillingSameAsShipping(!!checked)
                      }
                    />
                    <Label
                      htmlFor="billing-same"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Same as shipping address
                    </Label>
                  </div>
                </CardHeader>
                {!billingSameAsShipping && (
                  <CardContent>
                    {renderAddressFields(billingAddress, updateBilling, "bill")}
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* STEP 2 — Payment */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  All transactions are secure and encrypted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={payment.method}
                  onValueChange={(v) =>
                    setPayment((p) => ({
                      ...p,
                      method: v as PaymentInfo["method"],
                    }))
                  }
                  className="space-y-3"
                >
                  <label
                    htmlFor="pm-credit"
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      payment.method === "credit_card"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="credit_card" id="pm-credit" />
                    <div>
                      <p className="font-medium">Credit Card</p>
                      <p className="text-xs text-muted-foreground">
                        Visa, Mastercard, AMEX
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="pm-debit"
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      payment.method === "debit_card"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="debit_card" id="pm-debit" />
                    <p className="font-medium">Debit Card</p>
                  </label>
                  <label
                    htmlFor="pm-cod"
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      payment.method === "cod"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="cod" id="pm-cod" />
                    <p className="font-medium">Cash on Delivery</p>
                  </label>
                </RadioGroup>

                {payment.method !== "cod" && (
                  <div className="grid gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number <span className="text-destructive">*</span></Label>
                      <Input
                        id="cardNumber"
                        placeholder="Card number"
                        value={payment.cardNumber}
                        onChange={(e) =>
                          setPayment((p) => ({
                            ...p,
                            cardNumber: formatCardNumber(e.target.value),
                          }))
                        }
                        maxLength={19}
                        className={paymentAttempted && payment.cardNumber.replace(/\s/g, "").length < 13 ? errCls : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card <span className="text-destructive">*</span></Label>
                      <Input
                        id="cardName"
                        placeholder="Name as on card"
                        value={payment.cardName}
                        onChange={(e) =>
                          setPayment((p) => ({
                            ...p,
                            cardName: e.target.value,
                          }))
                        }
                        className={paymentAttempted && !payment.cardName.trim() ? errCls : ""}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="expiry"
                          placeholder="MM / YY"
                          value={payment.expiry}
                          onChange={(e) =>
                            setPayment((p) => ({
                              ...p,
                              expiry: formatExpiry(e.target.value),
                            }))
                          }
                          maxLength={5}
                          className={paymentAttempted && payment.expiry.length < 5 ? errCls : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV <span className="text-destructive">*</span></Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="CVV"
                          value={payment.cvv}
                          onChange={(e) =>
                            setPayment((p) => ({
                              ...p,
                              cvv: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 4),
                            }))
                          }
                          maxLength={4}
                          className={paymentAttempted && payment.cvv.length < 3 ? errCls : ""}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Lock className="h-3 w-3" />
                      Your payment information is encrypted and secure
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Items List */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items ({items.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item: CartItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                          data-ai-hint={item.dataAiHint}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Shipping Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Shipping Details
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(1)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="font-medium">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </p>
                  <p>
                    {shippingAddress.street}
                    {shippingAddress.apartment
                      ? `, ${shippingAddress.apartment}`
                      : ""}
                  </p>
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}{" "}
                    {shippingAddress.zipCode}
                  </p>
                  <p>{shippingAddress.country}</p>
                  <p className="text-muted-foreground">
                    {shippingAddress.phone}
                  </p>
                  <Separator className="my-2" />
                  <p>
                    {shippingMethod === "express"
                      ? "Express (2–3 days)"
                      : "Standard (5–7 days)"}{" "}
                    —{" "}
                    <span className="font-medium">
                      {shippingCost === 0
                        ? "Free"
                        : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Payment Method</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(2)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  {payment.method === "cod" ? (
                    <p className="font-medium">Cash on Delivery</p>
                  ) : (
                    <div>
                      <p className="font-medium">
                        {payment.method === "credit_card"
                          ? "Credit Card"
                          : "Debit Card"}
                      </p>
                      <p className="text-muted-foreground">
                        •••• •••• ••••{" "}
                        {payment.cardNumber.replace(/\s/g, "").slice(-4)}
                      </p>
                      <p className="text-muted-foreground">
                        {payment.cardName}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/cart">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to Cart
                </Link>
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={goNext}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="px-8"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Place Order — ${orderTotal.toFixed(2)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary Sidebar ────────────────── */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compact item list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="truncate mr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${cartTotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shippingCost === 0
                      ? "Free"
                      : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg text-primary">
                <span>Total</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>

              {/* Trust badges */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Free returns within 30 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
