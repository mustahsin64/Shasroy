"use client";

import Link from "next/link";

export type SlipSize = "a4" | "a5";

export function PrintControls({ orderId, size }: { orderId: string; size: SlipSize }) {
  return <div className="print-controls no-print">
    <div role="group" aria-label="কাগজের মাপ">
      <Link href={`/admin/orders/${orderId}/print?size=a4`} replace aria-current={size === "a4" ? "true" : undefined}>A4 (পুরো পাতা)</Link>
      <Link href={`/admin/orders/${orderId}/print?size=a5`} replace aria-current={size === "a5" ? "true" : undefined}>A5 (অর্ধেক A4)</Link>
    </div>
    <button type="button" onClick={() => window.print()}>প্রিন্ট করুন</button>
    <Link href={`/admin/orders/${orderId}`}>← অর্ডারে ফিরুন</Link>
  </div>;
}
