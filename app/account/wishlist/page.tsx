import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getWishlist } from "@/lib/data/account";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const products = await getWishlist(user.id);
  return (
    <section aria-labelledby="wl-heading">
      <h2 id="wl-heading" className="mb-5 font-display text-xl font-bold">Wishlist</h2>
      {products.length > 0 ? (
        <>
          <ProductGrid products={products} />
          <p className="mt-8 text-sm text-neutral-600">Open a product to remove it from your wishlist.</p>
        </>
      ) : (
        <EmptyState
          title="Nothing saved yet"
          body="Tap “Save to wishlist” on any product to keep it here."
          actionHref="/products"
          actionLabel="Browse products"
        />
      )}
    </section>
  );
}
