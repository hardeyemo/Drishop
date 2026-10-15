// Safe to import from client components (no server-only code here).

export type QuoteLine = {
  variantId: string;
  productId: string;
  slug: string;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPriceKobo: number;
  quantity: number;
  lineTotalKobo: number;
  stock: number;
};

export type Quote = {
  lines: QuoteLine[];
  subtotalKobo: number;
  discountKobo: number;
  /** null until a delivery state is chosen */
  shippingKobo: number | null;
  totalKobo: number;
  firstOrderFreeDelivery: boolean;
};

export type CheckoutFailure = {
  ok: false;
  error: string;
  field: "cart" | "discount" | "shipping" | "address";
  variantId?: string;
  offerReserved?: boolean;
};

export type QuoteResult = { ok: true; quote: Quote } | CheckoutFailure;

export type AddressInput = {
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
};

export type PlaceOrderInput = {
  items: { variantId: string; quantity: number }[];
  address: AddressInput;
  discountCode?: string;
  notes?: string;
  saveAddress: boolean;
  idempotencyKey: string;
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | (CheckoutFailure & { fieldErrors?: Record<string, string[] | undefined> })
  | { ok: false; error: string; field: "address"; fieldErrors: Record<string, string[] | undefined> };
