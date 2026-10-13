import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import { CancelOrderButton } from "@/components/checkout/cancel-order-button";
import { PayNowButton } from "@/components/checkout/pay-now-button";

type Props = { params: Promise<{ orderNumber: string }> };

export const metadata: Metadata = { title: "Order details" };

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Awaiting payment", cls: "bg-gold-soft text-gold-deep" },
  paid: { label: "Paid", cls: "bg-green-100 text-green-800" },
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-800" },
  shipped: { label: "Shipped", cls: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered", cls: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", cls: "bg-neutral-200 text-neutral-700" },
  refunded: { label: "Refunded", cls: "bg-neutral-200 text-neutral-700" },
};

type Row = {
  id: string;
  order_number: string;
  status: string;
  subtotal_kobo: number;
  discount_kobo: number;
  shipping_kobo: number;
  total_kobo: number;
  expires_at: string | null;
  carrier: string | null;
  tracking_number: string | null;
  created_at: string;
  shipping_address: { recipient_name: string; phone: string; line1: string; line2?: string; city: string; state: string };
  items: { id: string; product_name: string; variant_name: string | null; unit_price_kobo: number; quantity: number; line_total_kobo: number }[];
};

const when = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });

export default async function OrderPage({ params }: Props) {
  const { orderNumber } = await params;
  if (!/^SHP-\d{4,}$/.test(orderNumber)) notFound();

  // As the signed-in user: RLS returns the order only if it belongs to them.
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,subtotal_kobo,discount_kobo,shipping_kobo,total_kobo,expires_at,carrier,tracking_number,created_at,shipping_address,items:order_items(id,product_name,variant_name,unit_price_kobo,quantity,line_total_kobo)",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!data) notFound();
  const order = data as unknown as Row;
  const status = STATUS[order.status] ?? { label: order.status, cls: "bg-neutral-200 text-neutral-700" };
  const a = order.shipping_address;

  return (
    <section aria-labelledby="order-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="order-heading" className="font-display text-xl font-bold">Order {order.order_number}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.cls}`}>{status.label}</span>
      </div>
      <p className="mt-1 text-sm text-neutral-600">Placed {when.format(new Date(order.created_at))}</p>

      {order.status === "pending" && order.expires_at ? (
        <div className="mt-5 rounded-xl border border-gold bg-gold-soft/50 p-4 text-sm">
          <p className="font-medium">Your items are reserved until {when.format(new Date(order.expires_at))}.</p>
          <p className="mt-1 text-neutral-700">After that, the order is cancelled and the items go back on sale.</p>
          <PayNowButton orderNumber={order.order_number} />
          <div className="mt-4"><CancelOrderButton orderId={order.id} /></div>
        </div>
      ) : null}
      {order.status === "shipped" ? <p className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm">Shipped{order.carrier ? ` with ${order.carrier}` : ""}{order.tracking_number ? ` · Tracking ${order.tracking_number}` : ""}</p> : null}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">{i.product_name}</p>
              {i.variant_name ? <p className="text-xs text-neutral-500">{i.variant_name}</p> : null}
              <p className="text-xs text-neutral-500">{formatNaira(i.unit_price_kobo)} × {i.quantity}</p>
            </div>
            <p className="tabular-nums">{formatNaira(i.line_total_kobo)}</p>
          </li>
        ))}
      </ul>

      <dl className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatNaira(order.subtotal_kobo)}</dd></div>
        {order.discount_kobo > 0 ? (
          <div className="flex justify-between text-green-700"><dt>Discount</dt><dd className="tabular-nums">-{formatNaira(order.discount_kobo)}</dd></div>
        ) : null}
        <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{order.shipping_kobo === 0 ? "Free" : formatNaira(order.shipping_kobo)}</dd></div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatNaira(order.total_kobo)}</dd></div>
      </dl>

      <div className="mt-8 text-sm">
        <h3 className="font-medium">Delivering to</h3>
        <address className="mt-1 not-italic text-neutral-700">
          {a.recipient_name}<br />
          {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
          {a.city}, {a.state}<br />
          {a.phone}
        </address>
      </div>
    </section>
  );
}
