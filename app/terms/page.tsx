import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SUPPORT_TEL, SUPPORT_WHATSAPP } from "@/lib/site-config";

export const metadata: Metadata = { title: "Terms and Conditions" };

const sections = [
  { title: "Using Drishop", body: "These terms apply when you browse or place an order on Drishop. By placing an order, you confirm that the information you provide is accurate and that you are able to enter into the purchase. Please review these terms before ordering. Your statutory consumer rights are not limited by these terms." },
  { title: "Products, prices and availability", body: "We aim to show accurate product descriptions, images, prices and stock. Product appearance may vary slightly from its image. Prices and delivery charges are shown in Nigerian naira and confirmed before you place an order. If a listing contains a material error or an item becomes unavailable, we will contact you to explain the available options." },
  { title: "Orders and payment", body: "Submitting an order creates a pending order while stock is reserved for a limited period shown in your order details. An order is accepted when payment is confirmed and the order status changes to paid. Payments are processed on Paystack's secure hosted checkout. Drishop does not receive or store your full card details. If payment does not complete, check your order page to retry or contact support; do not submit a duplicate order." },
  { title: "Delivery", body: "Available delivery states, charges and the current delivery fee are shown at checkout before you place an order. Delivery timing can depend on your location and courier conditions. We will use the contact and address details you provide to fulfil the order and help with delivery." },
  { title: "Changes, cancellations and returns", body: "You may cancel an unpaid order from its order page while cancellation is available. For a paid order, a cancellation, return, replacement or refund depends on the order status, the condition and type of goods, and applicable consumer law. Contact us promptly with your order number so we can explain the process. Nothing in these terms removes a consumer right that applicable law gives you." },
  { title: "Accounts and acceptable use", body: "Keep your sign-in details private and tell us if you suspect unauthorised access. Do not misuse the site, interfere with its security, or submit information that you do not have the right to provide. We may restrict access when necessary to protect customers, orders or the service." },
  { title: "Privacy and cookies", body: <>We use account and order information to operate Drishop and fulfil purchases. See our <Link href="/cookies" className="font-semibold text-emerald-800 underline">Cookie Policy</Link> for details about browser storage and essential cookies. Do not send payment card details to support.</> },
  { title: "Contact and updates", body: <>For questions about an order or these terms, call <a href={SUPPORT_TEL} className="font-semibold text-emerald-800 underline">07045786141</a> or <a href={SUPPORT_WHATSAPP} className="font-semibold text-emerald-800 underline">message us on WhatsApp</a>. We may update these terms when our service changes; the effective date below identifies the current version. An update does not change an order already confirmed.</> },
];

export default function TermsPage() {
  return <article className="mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:px-8">
    <p className="text-sm font-semibold text-emerald-800">{SITE_NAME}</p>
    <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Terms and Conditions</h1>
    <p className="mt-2 text-sm text-slate-500">Effective 17 October 2026</p>
    <p className="mt-6 leading-relaxed text-slate-700">These terms explain how shopping, orders and payments work on Drishop. Please read them before completing a purchase.</p>
    <div className="mt-8 divide-y divide-line rounded-xl border border-line px-4 sm:px-6">
      {sections.map((section) => <section key={section.title} className="py-5"><h2 className="font-display text-lg font-bold">{section.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{section.body}</p></section>)}
    </div>
  </article>;
}
