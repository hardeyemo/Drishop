"use client";

import * as React from "react";

export function PayNowButton({ orderNumber }: { orderNumber: string }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  async function pay() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.authorizationUrl !== "string") throw new Error(result.error ?? "Payment could not start.");
      window.location.assign(result.authorizationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment could not start. Try again.");
      setBusy(false);
    }
  }
  return <div className="mt-3">
    <button type="button" onClick={pay} disabled={busy} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
      {busy ? "Opening secure payment…" : "Pay securely with Paystack"}
    </button>
    {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
  </div>;
}
