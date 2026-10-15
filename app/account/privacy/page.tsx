import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { DeleteAccountForm } from "@/components/account/delete-account-form";

export const metadata: Metadata = { title: "Privacy and account deletion" };

export default async function PrivacyPage() {
  const user = await requireUser("/account/privacy");
  const requiresPassword = user.app_metadata?.provider === "email"
    || (user.identities ?? []).some((identity) => identity.provider === "email");

  return (
    <section aria-labelledby="privacy-heading" className="space-y-8">
      <div>
        <h2 id="privacy-heading" className="font-display text-xl font-bold">Privacy and account deletion</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">Permanently remove your Drishop account and personal data. Order totals, items, payment references, and status are retained for transaction records, while your account is detached and customer and delivery details are anonymized.</p>
      </div>
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:p-6">
        <h3 className="font-display text-lg font-bold text-red-900">Delete account</h3>
        <p className="mt-2 text-sm leading-relaxed text-red-900/80">This action cannot be undone. Your profile, addresses, wishlist, saved cart, reviews, and notifications will be removed. Pending orders and payment records remain as anonymized transaction history.</p>
        <DeleteAccountForm requiresPassword={requiresPassword} />
      </div>
    </section>
  );
}
