import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { CheckoutForm, type SavedAddress, type Zone } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const supabase = await createClient();

  const [zonesRes, addressesRes, profile] = await Promise.all([
    createPublicClient().from("shipping_zones").select("state, fee_kobo").eq("is_active", true).order("state"),
    supabase
      .from("addresses")
      .select("id, label, recipient_name, phone, line1, line2, city, state, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    getProfile(),
  ]);

  const zones: Zone[] = (zonesRes.data ?? []).map((z) => ({ state: z.state, feeKobo: z.fee_kobo }));
  const addresses: SavedAddress[] = (addressesRes.data ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    recipientName: a.recipient_name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Checkout</h1>
      <CheckoutForm
        zones={zones}
        addresses={addresses}
        defaults={{ fullName: profile?.fullName ?? "", phone: profile?.phone ?? "" }}
      />
    </div>
  );
}
