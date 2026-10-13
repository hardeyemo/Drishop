export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string | null;
  priceKobo: number; // Display only. Checkout always reads the current database price.
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
  availableStock: number;
  unavailable?: boolean;
};

export type CartLine = { variantId: string; quantity: number };
