"use client";
import { useSyncExternalStore } from "react";
import { formatBanglaClock } from "@/lib/bangla-clock";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 15_000);
  return () => clearInterval(id);
}

const readClock = () => formatBanglaClock(Date.now(), -new Date().getTimezoneOffset());

/**
 * Live time on the visitor's device. The server sends a placeholder that SiteHeader's inline
 * script fills before first paint, so hydration may see different text.
 */
export function ShopClock() {
  const text = useSyncExternalStore(subscribe, readClock, () => " ");
  return <time id="shop-clock" className="shop-clock" title="আপনার স্থানীয় সময়" suppressHydrationWarning>{text}</time>;
}
