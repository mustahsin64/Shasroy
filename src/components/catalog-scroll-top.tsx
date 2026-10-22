"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Keeps filter/sort/search navigation predictable: one instant jump to the top of the catalog,
 *  instead of the browser smooth-scrolling to the results anchor after the layout swaps. */
export function CatalogScrollTop() {
  const params = useSearchParams();
  const key = `${params.get("q") ?? ""}|${params.get("category") ?? ""}|${params.get("sort") ?? ""}`;
  useEffect(() => {
    // Leave genuine in-page anchor jumps (header nav, hero buttons) alone.
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [key]);
  return null;
}
