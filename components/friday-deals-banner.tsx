"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { formatCountdown, getFridayDealWindow } from "@/lib/friday-deals";

export function FridayDealsBanner({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [now, setNow] = React.useState<number | null>(null);
  const activeRef = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    const update = () => {
      const current = Date.now();
      const active = getFridayDealWindow(new Date(current)).active;
      if (activeRef.current !== null && activeRef.current !== active) router.refresh();
      activeRef.current = active;
      setNow(current);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [router]);

  const dealWindow = now === null ? null : getFridayDealWindow(new Date(now));
  const countdown = dealWindow && now !== null ? formatCountdown(dealWindow.target.getTime() - now) : "--:--:--";

  return (
    <section className={`overflow-hidden rounded-2xl bg-gradient-to-r from-[#073f33] via-[#075c46] to-[#0b7654] text-white shadow-lg shadow-emerald-950/10 ${compact ? "px-4 py-4 sm:px-5" : "px-5 py-5 sm:px-7 sm:py-6"}`} aria-label="Friday Crazy Deals">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ffdf76] sm:text-xs">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Every week
          </p>
          <h2 className={`mt-1 font-display font-extrabold tracking-tight ${compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>
            Crazy Cheap Deals Every Friday, 1:00 AM – 2:00 AM!
          </h2>
          <p className="mt-1 text-xs text-white/75">Nigeria time (WAT)</p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="min-w-32 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm">
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white/80">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {dealWindow?.active ? "Ends in" : "Starts in"}
            </p>
            <p className="mt-0.5 font-mono text-xl font-bold tabular-nums" aria-label={dealWindow ? `${dealWindow.active ? "Ends" : "Starts"} in ${countdown}` : "Countdown loading"}>
              {countdown}
            </p>
          </div>
          <Link href="/products" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[#ffdf76] px-4 text-sm font-extrabold text-emerald-950 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Shop deals <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
