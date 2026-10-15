import { MessageCircle, Phone } from "lucide-react";
import { SUPPORT_PHONE, SUPPORT_TEL, SUPPORT_WHATSAPP } from "@/lib/site-config";

export function SupportContact({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`rounded-xl border border-emerald-900/10 bg-[#f0f7f2] ${compact ? "p-3" : "p-5 sm:p-6"}`} aria-label="Customer support">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display font-bold text-emerald-950">Need help?</h2>
          <p className="mt-0.5 text-sm text-slate-600">Delivery or Order Enquiries</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={SUPPORT_TEL} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#075c46] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">
            <Phone className="h-4 w-4" aria-hidden="true" /> Call Customer Support <span className="sr-only">at {SUPPORT_PHONE}</span>
          </a>
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-emerald-900/20 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
            <span className="sr-only">opens in a new tab</span>
          </a>
        </div>
      </div>
      {!compact ? <p className="mt-3 text-xs text-slate-500">Call {SUPPORT_PHONE}</p> : null}
    </section>
  );
}
