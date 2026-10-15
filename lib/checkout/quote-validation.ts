export type QuoteRequestLine = { variantId: string; quantity: number };

export type QuoteRpcLine = {
  variant_id: string;
  product_id: string;
  slug: string;
  product_name: string;
  variant_name: string | null;
  sku: string;
  unit_price_kobo: number;
  quantity: number;
  line_total_kobo: number;
  stock: number;
};

export type QuoteRpcResult = {
  lines?: QuoteRpcLine[];
  subtotal_kobo?: number;
  discount_kobo?: number;
  shipping_kobo?: number | null;
  total_kobo?: number;
  first_order_free_delivery?: boolean;
};

export type VerifiedQuote = {
  lines: {
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
  }[];
  subtotalKobo: number;
  discountKobo: number;
  shippingKobo: number | null;
  totalKobo: number;
  firstOrderFreeDelivery: boolean;
};

type Verification = { quote: VerifiedQuote; reason: null } | { quote: null; reason: string };

/** SQL groups cart rows by variant ID. Match that canonical form before checking the RPC response. */
export function consolidateQuoteItems(items: QuoteRequestLine[]): QuoteRequestLine[] {
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  return [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function verifyQuoteResult(
  value: unknown,
  requestedItems: QuoteRequestLine[],
  hasDeliveryState: boolean,
): Verification {
  const result = value as QuoteRpcResult | null;
  const integer = (number: unknown): number is number => Number.isSafeInteger(number) && (number as number) >= 0;
  if (!result || !Array.isArray(result.lines) || result.lines.length !== requestedItems.length
      || result.lines.some((line) => !line || typeof line !== "object")
      || !integer(result.subtotal_kobo) || !integer(result.discount_kobo)
      || !(result.shipping_kobo === null || integer(result.shipping_kobo))
      || !integer(result.total_kobo) || typeof result.first_order_free_delivery !== "boolean") {
    return { quote: null, reason: "response_shape" };
  }

  const requested = new Map(requestedItems.map((item) => [item.variantId, item.quantity]));
  const lines = result.lines.map((line) => ({
    variantId: line.variant_id,
    productId: line.product_id,
    slug: line.slug,
    productName: line.product_name,
    variantName: line.variant_name,
    sku: line.sku,
    unitPriceKobo: line.unit_price_kobo,
    quantity: line.quantity,
    lineTotalKobo: line.line_total_kobo,
    stock: line.stock,
  }));

  const validLines = lines.every((line) => requested.get(line.variantId) === line.quantity
    && Number.isSafeInteger(line.unitPriceKobo) && line.unitPriceKobo > 0
    && Number.isSafeInteger(line.quantity) && line.quantity > 0
    && Number.isSafeInteger(line.lineTotalKobo) && line.lineTotalKobo === line.unitPriceKobo * line.quantity
    && Number.isSafeInteger(line.stock) && line.stock >= line.quantity);
  if (!validLines || new Set(lines.map((line) => line.variantId)).size !== requested.size) {
    return { quote: null, reason: "line_integrity" };
  }

  const subtotal = result.subtotal_kobo;
  const discount = result.discount_kobo;
  const shipping = result.shipping_kobo;
  const total = result.total_kobo;
  if (lines.reduce((sum, line) => sum + line.lineTotalKobo, 0) !== subtotal || discount > subtotal) {
    return { quote: null, reason: "subtotal_integrity" };
  }
  if ((hasDeliveryState ? shipping === null : shipping !== null)
      || total !== subtotal - discount + (shipping ?? 0)) {
    return { quote: null, reason: "total_integrity" };
  }

  return {
    reason: null,
    quote: {
      lines,
      subtotalKobo: subtotal,
      discountKobo: discount,
      shippingKobo: shipping,
      totalKobo: total,
      firstOrderFreeDelivery: result.first_order_free_delivery,
    },
  };
}
