import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { getCart } from "@/lib/cart";
import { listDeliveryZones } from "@/lib/checkout";
import { formatNumberBn, formatTaka } from "@/lib/format";

export const metadata: Metadata = { title: "অর্ডার করুন", robots: { index: false } };

export default async function CheckoutPage() {
  const [cart, zones] = await Promise.all([getCart(), listDeliveryZones()]);
  const noZones = zones.length === 0;
  const blocked = cart.lines.length === 0 || cart.hasIssues || noZones;

  return <div className="shop-background"><div className="container-shell">
    <div className="cart-page">
      <div className="section-title"><span>✧</span><h1>অর্ডার করুন</h1><div className="dotted-rule" /></div>

      {blocked ? <div className="cart-empty">
        <ShoppingBag size={48} strokeWidth={1} />
        {cart.lines.length === 0
          ? <><p>আপনার ব্যাগ খালি।</p><Link href="/#products">পণ্য দেখুন</Link></>
          : noZones
          ? <><p>এই মুহূর্তে অর্ডার নেওয়া বন্ধ আছে (ডেলিভারি এলাকা চালু নেই)। একটু পরে আবার চেষ্টা করুন।</p><Link href="/cart">ব্যাগে ফিরে যান</Link></>
          : <><p>ব্যাগের কিছু পণ্যে সমস্যা আছে। আগে ঠিক করে নিন।</p><Link href="/cart">ব্যাগে ফিরে যান</Link></>}
      </div> : <>
        <details className="checkout-items" open>
          <summary>ব্যাগে {formatNumberBn(cart.itemCount)}টি পণ্য · {formatTaka(cart.subtotalPaisa)} <Link href="/cart">বদলান</Link></summary>
          <ul>{cart.lines.map(line => <li key={line.id}>
            <span>{line.productNameBn}{line.variantCount > 1 && ` (${line.variantNameBn})`} × {formatNumberBn(line.quantity)}</span>
            <span>{formatTaka(line.lineTotalPaisa)}</span>
          </li>)}</ul>
        </details>
        <CheckoutForm zones={zones} subtotalPaisa={cart.subtotalPaisa} />
      </>}
    </div>
  </div></div>;
}
