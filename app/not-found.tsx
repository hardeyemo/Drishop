import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-neutral-600">That page doesn&apos;t exist, or the product is no longer available.</p>
      <Link href="/products" className={buttonVariants({ variant: "gold", className: "mt-8" })}>
        Browse products
      </Link>
    </div>
  );
}
