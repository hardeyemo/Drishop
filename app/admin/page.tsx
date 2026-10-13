import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import { updateOrderStatus, toggleProductStatus } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Admin dashboard" };

const transitions: Record<string, string[]> = { paid: ["processing"], processing: ["shipped"], shipped: ["delivered"] };

export default async function AdminPage() {
  await requireAdmin();
  const db = await createClient();
  const [ordersRes, productsRes, productsCount, ordersCount] = await Promise.all([
    db.from("orders").select("id,order_number,email,status,total_kobo,created_at,carrier,tracking_number")
      .order("created_at", { ascending: false }).limit(12),
    db.from("products").select("id,name,slug,is_active,total_stock,min_price_kobo").order("name").limit(30),
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }),
  ]);
  const orders = ordersRes.data ?? [];
  const products = productsRes.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 lg:px-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[.18em] text-gold-deep">Shopora operations</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Admin dashboard</h1>
      </div>

      <section aria-label="Store totals" className="grid gap-4 sm:grid-cols-3">
        {[
          ["Orders", ordersCount.count ?? 0],
          ["Products", productsCount.count ?? 0],
          ["Orders needing action", orders.filter((o) => transitions[o.status]?.length).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm text-neutral-600">{label}</p><p className="mt-2 font-display text-3xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="font-display text-2xl font-bold">Recent orders</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-neutral-600"><tr>
              <th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Fulfilment</th>
            </tr></thead>
            <tbody className="divide-y divide-line bg-white">
              {orders.map((order) => <tr key={order.id}>
                <td className="px-4 py-4 font-medium">{order.order_number}<p className="mt-1 text-xs font-normal text-neutral-500">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(order.created_at))}</p></td>
                <td className="px-4 py-4">{order.email}</td><td className="px-4 py-4">{formatNaira(order.total_kobo)}</td>
                <td className="px-4 py-4 capitalize">{order.status}</td>
                <td className="px-4 py-4">
                  {transitions[order.status]?.length ? <form action={updateOrderStatus} className="flex min-w-[310px] flex-wrap gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select name="status" className="h-9 rounded-md border border-line px-2 text-xs">
                      {transitions[order.status].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {order.status === "processing" ? <><input name="carrier" defaultValue={order.carrier ?? ""} placeholder="Carrier" className="h-9 w-24 rounded-md border border-line px-2 text-xs" /><input name="trackingNumber" defaultValue={order.tracking_number ?? ""} placeholder="Tracking #" className="h-9 w-28 rounded-md border border-line px-2 text-xs" /></> : null}
                    <button className="h-9 rounded-md bg-ink px-3 text-xs font-medium text-white hover:bg-neutral-800">Save</button>
                  </form> : <span className="text-neutral-500">No action</span>}
                </td>
              </tr>)}
              {orders.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-neutral-500">No orders yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="products-heading">
        <h2 id="products-heading" className="font-display text-2xl font-bold">Catalogue and stock</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <article key={product.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
            <div className="min-w-0"><h3 className="truncate font-medium">{product.name}</h3><p className="mt-1 text-xs text-neutral-600">{formatNaira(product.min_price_kobo)} · {product.total_stock} in stock · {product.is_active ? "Live" : "Hidden"}</p></div>
            <form action={toggleProductStatus}>
              <input type="hidden" name="productId" value={product.id} /><input type="hidden" name="active" value={String(!product.is_active)} />
              <button className="shrink-0 rounded-md border border-line px-3 py-2 text-xs font-medium hover:bg-surface">{product.is_active ? "Hide" : "Publish"}</button>
            </form>
          </article>)}
          {products.length === 0 ? <p className="text-sm text-neutral-500">No products in the catalogue.</p> : null}
        </div>
      </section>
    </div>
  );
}
