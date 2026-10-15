export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  minPriceKobo: number;
  compareAtKobo: number | null;
  totalStock: number;
  ratingAvg: number;
  ratingCount: number;
  imageUrl: string | null;
  imageAlt: string | null;
  categoryName: string | null;
  description: string | null;
  fridayDeal: boolean;
  variants: ProductCardVariant[];
};

export type ProductCardVariant = Pick<Variant, "id" | "name" | "priceKobo" | "stock" | "fridayDeal">;

export type Variant = {
  id: string;
  sku: string;
  name: string;
  priceKobo: number;
  compareAtKobo: number | null;
  stock: number;
  fridayDeal: boolean;
};

export type ProductDetail = Omit<ProductCardData, "variants"> & {
  categorySlug: string | null;
  images: { url: string; alt: string | null }[];
  variants: Variant[];
};
