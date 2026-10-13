"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/app/actions/checkout";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pending, start] = React.useTransition();

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        Cancel order
      </Button>
    );
  }
  return (
    <div className="space-y-2" role="group" aria-label="Confirm cancellation">
      <p className="text-sm">Cancel this order? Your reserved items go back on sale.</p>
      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await cancelOrder(orderId);
              if (res.ok) router.refresh();
              else setError(res.message ?? "Couldn't cancel this order.");
            })
          }
        >
          {pending ? "Cancelling…" : "Yes, cancel order"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
          Keep order
        </Button>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
