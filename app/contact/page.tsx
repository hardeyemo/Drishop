import type { Metadata } from "next";
import { SupportContact } from "@/components/support-contact";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:px-8">
      <p className="text-sm font-semibold text-emerald-800">We’re here to help</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Contact Us</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">For delivery or order enquiries, call or message our customer support team.</p>
      <div className="mt-7"><SupportContact /></div>
    </div>
  );
}
