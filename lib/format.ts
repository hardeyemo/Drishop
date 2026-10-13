const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Prices are stored as integer kobo. */
export function formatNaira(kobo: number): string {
  return naira.format(kobo / 100);
}

export function discountPercent(priceKobo: number, compareAtKobo: number | null): number {
  if (!compareAtKobo || compareAtKobo <= priceKobo) return 0;
  return Math.round((1 - priceKobo / compareAtKobo) * 100);
}
