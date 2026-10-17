import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SUPPORT_TEL, SUPPORT_WHATSAPP } from "@/lib/site-config";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return <article className="mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:px-8">
    <p className="text-sm font-semibold text-emerald-800">{SITE_NAME}</p>
    <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Cookie Policy</h1>
    <p className="mt-2 text-sm text-slate-500">Effective 17 October 2026</p>
    <div className="mt-8 space-y-6 rounded-xl border border-line p-5 sm:p-7">
      <section><h2 className="font-display text-lg font-bold">What this site stores</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Drishop uses essential session cookies through Supabase so you can sign in securely and keep your account session while you use the site. These cookies support account access and checkout.</p></section>
      <section><h2 className="font-display text-lg font-bold">Browser storage</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">To keep shopping working, Drishop may save a guest shopping cart and recently viewed products in your browser's local storage. This is browser storage, not a cookie. A signed-in cart is saved to your account. Clearing browser data removes locally saved guest cart and browsing history; it does not remove orders from your account.</p></section>
      <section><h2 className="font-display text-lg font-bold">Third-party checkout</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">When you choose to pay, you are sent to Paystack's hosted checkout. Paystack may use cookies or similar technologies on its own pages under its privacy and cookie terms. Drishop does not receive or store your full payment card details.</p></section>
      <section><h2 className="font-display text-lg font-bold">Analytics and advertising</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">The Drishop site is not currently configured to use analytics or advertising cookies. If that changes, this policy and the cookie notice will be updated before those technologies are introduced.</p></section>
      <section><h2 className="font-display text-lg font-bold">Your choices</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">You can manage or delete cookies and local storage in your browser settings. Blocking essential session cookies may prevent sign-in and checkout from working. You can dismiss the on-site cookie notice; this only stores your notice preference in this browser and does not enable optional cookies.</p></section>
      <section><h2 className="font-display text-lg font-bold">Contact</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">For questions about this policy or your information, call <a href={SUPPORT_TEL} className="font-semibold text-emerald-800 underline">07045786141</a> or <a href={SUPPORT_WHATSAPP} className="font-semibold text-emerald-800 underline">message us on WhatsApp</a>. You can also read our <Link href="/terms" className="font-semibold text-emerald-800 underline">Terms and Conditions</Link>.</p></section>
    </div>
  </article>;
}
