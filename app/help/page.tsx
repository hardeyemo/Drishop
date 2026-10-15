import type { Metadata } from "next";
import Link from "next/link";
import { SupportContact } from "@/components/support-contact";

export const metadata: Metadata = { title: "Help / FAQ" };

const faqs = [
  {
    question: "How can I check my order status?",
    answer: <>Sign in and open <Link href="/account" className="font-semibold text-emerald-800 underline underline-offset-2">My account</Link> to view your orders and tracking details.</>,
  },
  {
    question: "Where can I see the delivery fee?",
    answer: "The checkout summary shows the delivery fee for your selected delivery state before you place an order.",
  },
  {
    question: "Can I cancel an order?",
    answer: "An unpaid pending order can be cancelled from its order details page. Contact support if you need help with another order status.",
  },
  {
    question: "How do I get help with delivery or an order?",
    answer: "Call or WhatsApp customer support using the contact options below. Having your order number ready can help us assist you.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:px-8">
      <p className="text-sm font-semibold text-emerald-800">Support</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Help / FAQ</h1>
      <dl className="mt-7 divide-y divide-line rounded-xl border border-line px-4 sm:px-6">
        {faqs.map((faq) => (
          <div key={faq.question} className="py-5">
            <dt className="font-display font-bold">{faq.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-7"><SupportContact /></div>
    </div>
  );
}
