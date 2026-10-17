"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/form/field";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/empty-state";
import { placeOrder, quoteCheckout } from "@/app/actions/checkout";
import { formatNaira } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_KOBO } from "@/lib/site-config";
import { MIN_CART_SUBTOTAL_KOBO } from "@/lib/site-config";
import type { AddressInput, Quote } from "@/lib/checkout/types";
import { NIGERIAN_STATES, NIGERIAN_STATE_SET } from "@/lib/nigeria";
import { FirstOrderOffer } from "@/components/first-order-offer";
import { SupportContact } from "@/components/support-contact";

export type Zone = { state: string; feeKobo: number };
export type SavedAddress = {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
};

type Problem = { message: string; variantId?: string; offerReserved?: boolean };

const selectCls =
  "h-12 w-full rounded-md border border-ink/20 bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep sm:h-11 sm:text-sm";

export function CheckoutForm({
  zones,
  addresses,
  defaults,
}: {
  zones: Zone[];
  addresses: SavedAddress[];
  defaults: { fullName: string; phone: string };
}) {
  const router = useRouter();
  const { items, hydrated, clear } = useCart();
  const [idempotencyKey] = React.useState(() => crypto.randomUUID());

  const first = addresses[0];
  const [addr, setAddr] = React.useState<AddressInput>({
    recipientName: first?.recipientName ?? defaults.fullName,
    phone: first?.phone ?? defaults.phone,
    line1: first?.line1 ?? "",
    line2: first?.line2 ?? "",
    city: first?.city ?? "",
    state: first && NIGERIAN_STATE_SET.has(first.state) ? first.state : "",
  });
  const [cities, setCities] = React.useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [saveAddress, setSaveAddress] = React.useState(addresses.length === 0);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  const [codeInput, setCodeInput] = React.useState("");
  const [appliedCode, setAppliedCode] = React.useState("");
  const [discountError, setDiscountError] = React.useState("");

  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [problem, setProblem] = React.useState<Problem | null>(null);
  const [pricing, setPricing] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[] | undefined>>({});
  const [submitError, setSubmitError] = React.useState<Problem | null>(null);
  const [submitting, startSubmit] = React.useTransition();
  const [placed, setPlaced] = React.useState(false);

  const lineInputs = React.useMemo(
    () => items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    [items],
  );
  const requestId = React.useRef(0);

  React.useEffect(() => {
    if (!addr.state) {
      setCities([]);
      setCitiesLoading(false);
      return;
    }
    const controller = new AbortController();
    setCitiesLoading(true);
    fetch(`/api/locations/cities?state=${encodeURIComponent(addr.state)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("City lookup unavailable");
        return response.json() as Promise<{ cities?: unknown }>;
      })
      .then((result) => setCities(Array.isArray(result.cities)
        ? result.cities.filter((city): city is string => typeof city === "string")
        : []))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setCities([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false);
      });
    return () => controller.abort();
  }, [addr.state]);

  // Ask the server for authoritative prices whenever the cart, state or code changes.
  React.useEffect(() => {
    if (!hydrated || lineInputs.length === 0 || placed) return;
    const id = ++requestId.current;
    setPricing(true);
    setQuote(null);
    quoteCheckout({ items: lineInputs, state: addr.state || undefined, code: appliedCode || undefined })
      .then((res) => {
        if (id !== requestId.current) return;
        setPricing(false);
        if (res.ok) {
          setQuote(res.quote);
          setProblem(null);
        } else if (res.field === "discount") {
          setDiscountError(res.error);
          setAppliedCode("");
        } else {
          setProblem({ message: res.error, variantId: res.variantId, offerReserved: res.offerReserved });
          setQuote(null);
        }
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setPricing(false);
        setProblem({ message: "We couldn't refresh your prices. Check your connection and reload." });
      });
  }, [hydrated, lineInputs, addr.state, appliedCode, placed]);

  function set<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setAddr((a) => ({ ...a, [key]: value }));
  }

  function pickSaved(id: string) {
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setAddr({
      recipientName: a.recipientName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: NIGERIAN_STATE_SET.has(a.state) ? a.state : "",
    });
    setSaveAddress(false);
  }

  function applyCode() {
    const code = codeInput.trim().toUpperCase();
    setDiscountError("");
    setAppliedCode(code);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    startSubmit(async () => {
      const res = await placeOrder({
        items: lineInputs,
        address: addr,
        discountCode: appliedCode || undefined,
        notes: notes || undefined,
        saveAddress,
        acceptedTerms: acceptedTerms as true,
        idempotencyKey,
      });
      if (res.ok) {
        const payment = await fetch("/api/payments/initialize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderNumber: res.orderNumber }),
        });
        const result = await payment.json();
        if (payment.ok && typeof result.authorizationUrl === "string") {
          setPlaced(true);
          clear();
          window.location.assign(result.authorizationUrl);
        } else {
          setSubmitError({ message: result.error ?? "Your order is reserved, but payment could not start. Open your order to retry." });
          clear();
          router.push(`/account/orders/${res.orderNumber}`);
        }
        return;
      }
      if ("fieldErrors" in res && res.fieldErrors) setFieldErrors(res.fieldErrors);
      setSubmitError({ message: res.error, variantId: "variantId" in res ? res.variantId : undefined,
        offerReserved: "offerReserved" in res ? res.offerReserved : undefined });
    });
  }

  if (placed) {
    return <p role="status" className="mt-10 text-sm text-neutral-600">Order placed. Taking you to your order…</p>;
  }

  if (!hydrated) {
    return <div className="mt-8 h-64 animate-pulse rounded-xl bg-surface" role="status" aria-label="Loading checkout" />;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          title="Your cart is empty"
          body="Add something to your cart before checking out."
          actionHref="/products"
          actionLabel="Browse products"
        />
      </div>
    );
  }

  const blocking = problem ?? null;
  const merchandiseSubtotalKobo = quote?.subtotalKobo ?? items.reduce((sum, item) => sum + item.priceKobo * item.quantity, 0);
  const amountToMinimum = Math.max(0, MIN_CART_SUBTOTAL_KOBO - merchandiseSubtotalKobo);
  const belowMinimum = merchandiseSubtotalKobo < MIN_CART_SUBTOTAL_KOBO;
  const canSubmit = !belowMinimum && Boolean(quote && Number.isSafeInteger(quote.totalKobo) && quote.totalKobo >= 0
    && quote.shippingKobo !== null) && !blocking && !pricing && Boolean(addr.state && addr.city.trim()) && acceptedTerms && !submitting;
  const zoneFee = zones.find((z) => z.state.toLowerCase() === addr.state.toLowerCase())?.feeKobo;
  const cityListId = "checkout-city-options";

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 grid min-w-0 gap-7 sm:mt-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-7 sm:space-y-8">
        <section aria-labelledby="delivery-heading" className="space-y-4">
          <h2 id="delivery-heading" className="font-display text-xl font-bold">Delivery details</h2>

          {addresses.length > 0 ? (
            <div>
              <label htmlFor="saved" className="mb-1.5 block text-sm font-medium">Use a saved address</label>
              <select id="saved" defaultValue={first?.id} onChange={(e) => pickSaved(e.target.value)} className={selectCls}>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label}: ` : ""}{a.line1}, {a.city}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="recipientName" label="Recipient name" autoComplete="name" required value={addr.recipientName}
              onChange={(e) => set("recipientName", e.target.value)} error={fieldErrors.recipientName?.[0]} />
            <Field id="phone" label="Phone number" type="tel" inputMode="tel" autoComplete="tel" required value={addr.phone}
              onChange={(e) => set("phone", e.target.value)} hint="For delivery updates." error={fieldErrors.phone?.[0]} />
          </div>
          <Field id="line1" label="Street address" autoComplete="address-line1" required value={addr.line1}
            onChange={(e) => set("line1", e.target.value)} error={fieldErrors.line1?.[0]} />
          <Field id="line2" label="Apartment, landmark (optional)" autoComplete="address-line2" value={addr.line2}
            onChange={(e) => set("line2", e.target.value)} error={fieldErrors.line2?.[0]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="state" className="mb-1.5 block text-sm font-medium">State</label>
              <select id="state" required value={addr.state} onChange={(e) => {
                setAddr((current) => ({ ...current, state: e.target.value, city: "" }));
                setFieldErrors((current) => ({ ...current, city: undefined, state: undefined }));
              }}
                aria-invalid={fieldErrors.state ? true : undefined} className={selectCls}>
                <option value="">Choose a state</option>
                {NIGERIAN_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.value === "FCT" ? "Federal Capital Territory (FCT / Abuja)" : state.value}
                  </option>
                ))}
              </select>
              {fieldErrors.state?.[0] ? <p className="mt-1 text-xs text-red-700">{fieldErrors.state[0]}</p> : null}
              {addr.state && zoneFee === undefined ? (
                <p className="mt-1 text-xs text-amber-800">Delivery pricing is not configured for this state yet.</p>
              ) : null}
              {addr.state && zoneFee !== undefined ? (
                <p className="mt-1 text-xs text-neutral-500">Configured delivery rate for {addr.state}: {formatNaira(zoneFee)}. Your final delivery fee is shown below.</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="city" className="mb-1.5 block text-sm font-medium">City or town</label>
              <input id="city" list={cityListId} autoComplete="address-level2" required minLength={2} maxLength={60}
                disabled={!addr.state} value={addr.city} onChange={(e) => set("city", e.target.value)}
                aria-invalid={fieldErrors.city ? true : undefined} aria-describedby="city-help" className={`${selectCls} disabled:cursor-not-allowed disabled:bg-neutral-100`} />
              <datalist id={cityListId}>
                {cities.map((city) => <option key={city} value={city} />)}
              </datalist>
              <p id="city-help" className="mt-1 text-xs text-neutral-500" role="status">
                {!addr.state ? "Choose a state first." : citiesLoading ? "Loading city suggestions…" : cities.length ? "Search and select a city or town, or enter another town." : "Suggestions are unavailable; you can enter your city or town."}
              </p>
              {fieldErrors.city?.[0] ? <p className="mt-1 text-xs text-red-700">{fieldErrors.city[0]}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">Delivery notes (optional)</label>
            <textarea id="notes" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep sm:text-sm" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-black" />
            Save this address for next time
          </label>
        </section>
      </div>

      <aside aria-labelledby="summary-heading" className="h-fit min-w-0 rounded-2xl border border-line p-4 sm:p-6 lg:sticky lg:top-40">
        <h2 id="summary-heading" className="font-display text-lg font-bold">Order summary</h2>
        {quote?.firstOrderFreeDelivery ? <FirstOrderOffer status="eligible" className="mt-4" /> : null}
        {problem?.offerReserved ? <FirstOrderOffer status="reserved" className="mt-4" /> : null}

        {blocking ? (
          <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p>{blocking.message}</p>
            {blocking.offerReserved ? <Link href="/account" className="mt-2 inline-block font-medium underline underline-offset-4">View your pending orders</Link> : null}
            <Link href="/cart" className="mt-2 inline-block font-medium underline underline-offset-4">Back to your cart</Link>
          </div>
        ) : null}

        <ul className="mt-4 divide-y divide-line">
          {(quote?.lines ?? []).map((l) => {
            const local = items.find((i) => i.variantId === l.variantId);
            return (
              <li key={l.variantId} className="flex gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface">
                  <ProductImage url={local?.imageUrl ?? null} name={l.productName} sizes="56px" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-medium">{l.productName}</p>
                  {l.variantName ? <p className="text-xs text-neutral-500">{l.variantName}</p> : null}
                  <p className="text-xs text-neutral-500">Qty {l.quantity}</p>
                </div>
                <p className="max-w-[42%] break-all text-right text-sm font-medium tabular-nums">{formatNaira(l.lineTotalKobo)}</p>
              </li>
            );
          })}
          {!quote && !blocking ? (
            <li className="flex items-center gap-2 py-6 text-sm text-neutral-600" role="status" aria-live="polite">
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink motion-reduce:animate-none" />
              {pricing ? "Updating prices and stock…" : "Waiting for a price quote…"}
            </li>
          ) : null}
        </ul>

        <div className="mt-4 border-t border-line pt-4">
          <label htmlFor="code" className="mb-1.5 block text-sm font-medium">Discount code</label>
          <div className="flex gap-2">
            <input id="code" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} maxLength={40}
              autoCapitalize="characters" autoComplete="off"
              onKeyDown={(e) => {
                // Enter here applies the code; it must never submit (place) the order.
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (codeInput.trim()) applyCode();
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-md border border-ink/20 px-3 text-base uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep sm:h-10 sm:text-sm" />
            <Button variant="outline" size="md" className="h-11 px-4 sm:h-10" onClick={applyCode} disabled={!codeInput.trim()}>Apply</Button>
          </div>
          {discountError ? <p role="alert" className="mt-1 text-xs text-red-700">{discountError}</p> : null}
          {appliedCode && quote && quote.discountKobo > 0 ? (
            <p role="status" className="mt-1 text-xs text-green-700">Code {appliedCode} applied.</p>
          ) : null}
        </div>

        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{quote ? formatNaira(quote.subtotalKobo) : "–"}</dd>
          </div>
          <div className={`flex justify-between ${quote && quote.discountKobo > 0 ? "text-green-700" : ""}`}>
            <dt>Discount</dt>
            <dd className="tabular-nums">{quote ? (quote.discountKobo > 0 ? `-${formatNaira(quote.discountKobo)}` : formatNaira(0)) : "–"}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd className="tabular-nums">
              {!addr.state
                ? "Choose a state"
                : pricing
                  ? "Calculating…"
                  : !quote || quote.shippingKobo === null
                    ? "Unavailable"
                : quote.shippingKobo === 0
                  ? "Free"
                  : formatNaira(quote.shippingKobo)}
            </dd>
          </div>
          {quote && quote.shippingKobo !== null && quote.shippingKobo > 0 ? (
            <p className="text-xs text-neutral-500">
              Free delivery on orders over {formatNaira(FREE_SHIPPING_THRESHOLD_KOBO)} after discounts.
            </p>
          ) : null}
        </dl>

        <p className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-medium">Total</span>
          <span className="font-display text-2xl font-extrabold tabular-nums" aria-live="polite">
            {quote ? formatNaira(quote.totalKobo) : "–"}
          </span>
        </p>

        {belowMinimum ? (
          <p className="mt-3 rounded-md bg-surface px-3 py-2 text-sm text-neutral-700" role="status" aria-live="polite">
            Add {formatNaira(amountToMinimum)} more in merchandise to reach the ₦10,000 minimum for checkout. Delivery fees and discounts do not count toward the minimum.
          </p>
        ) : null}

        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Your total includes the confirmed delivery fee and any discount. Payment is completed securely with Paystack after you continue.
        </p>

        <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
          <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-800" />
          <span>I agree to the <Link href="/terms" target="_blank" className="font-semibold text-emerald-800 underline">Terms and Conditions</Link>.</span>
        </label>

        {submitError ? (
          <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {submitError.message}
            {submitError.variantId ? (
              <Link href="/cart" className="ml-1 font-medium underline underline-offset-4">Review cart</Link>
            ) : null}
            {submitError.offerReserved ? <Link href="/account" className="ml-1 font-medium underline underline-offset-4">View your pending orders</Link> : null}
          </p>
        ) : null}

        <Button type="submit" variant="gold" size="lg" className="mt-5 w-full" disabled={!canSubmit}>
          {submitting ? "Preparing secure payment…" : "Continue to secure payment"}
        </Button>
        <Link href="/cart" className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-2 w-full" })}>
          Back to cart
        </Link>
        <div className="mt-4"><SupportContact compact /></div>
      </aside>
    </form>
  );
}
