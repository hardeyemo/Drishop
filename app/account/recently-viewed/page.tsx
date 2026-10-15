import type { Metadata } from "next";
import { RecentlyViewedHistory } from "@/components/account/recently-viewed-history";

export const metadata: Metadata = { title: "Recently viewed" };

export default function RecentlyViewedPage() {
  return (
    <section aria-labelledby="recently-viewed-heading">
      <h2 id="recently-viewed-heading" className="mb-1 font-display text-xl font-bold">Recently viewed</h2>
      <p className="mb-5 text-sm text-neutral-600">Manage the products you have viewed on this device.</p>
      <RecentlyViewedHistory />
    </section>
  );
}
