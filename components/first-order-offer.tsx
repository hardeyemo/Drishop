import Link from "next/link";
import { Truck } from "lucide-react";
import type { FirstOrderOfferStatus } from "@/lib/checkout/first-order-offer";

export function FirstOrderOffer({ status, className = "" }: { status: FirstOrderOfferStatus; className?: string }) {
  if (status === "used") return null;
  const text = status === "reserved"
    ? "Your free delivery is reserved for a pending first order. Complete or cancel it before starting another checkout."
    : status === "anonymous"
      ? "Free delivery on your first order when you sign in and check out."
      : "Free delivery on your first successful order.";
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 ${className}`} role="status">
      <Truck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{text}</p>
        {status === "anonymous" ? <Link href="/login?next=%2Fcheckout" className="mt-1 inline-flex min-h-9 items-center text-xs font-semibold underline underline-offset-2">Sign in to claim</Link> : null}
      </div>
    </div>
  );
}
