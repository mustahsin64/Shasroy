import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/product-card";
import { getCart, MAX_QUANTITY_PER_LINE, type CartLine } from "@/lib/cart";
import { formatNumberBn, formatTaka } from "@/lib/format";
import { removeCartItemAction, updateCartItemAction } from "./actions";

export const metadata: Metadata = { title: "আমার ব্যাগ" };

function LineIssue({ line }: { line: CartLine }) {
  if (line.issue === "unavailable") return <p className="line-issue">এই পণ্যটি এখন পাওয়া যাচ্ছে না। ব্যাগ থেকে সরিয়ে দিন।</p>;
  if (line.issue === "insufficient") return <p className="line-issue">স্টকে আছে মাত্র {formatNumberBn(line.stockQuantity)}টি। পরিমাণ কমিয়ে দিন।</p>;
  return null;
}

export default async function CartPage() {
  const cart = await getCart();

  return <div className="shop-background"><div className="container-shell">
    <div className="cart-page">
      <div className="section-title"><span>✧</span><h1>আমার ব্যাগ</h1><div className="dotted-rule" /></div>

      {cart.lines.length === 0 ? <div className="cart-empty">
        <ShoppingBag size={48} strokeWidth={1} />
        <p>আপনার ব্যাগ এখনো খালি।</p>
        <Link href="/#products">পণ্য দেখুন</Link>
      </div> : <div className="cart-layout">
        <ul className="cart-lines">
          {cart.lines.map(line => {
            const max = Math.min(line.stockQuantity, MAX_QUANTITY_PER_LINE);
            return <li key={line.id} className={line.available ? undefined : "line-unavailable"}>
              <Link href={`/products/${line.productSlug}`} className="line-photo"><ProductImage path={line.imagePath} alt={line.productNameBn} sizes="96px" /></Link>
              <div className="line-body">
                <Link href={`/products/${line.productSlug}`} className="line-name">{line.productNameBn}</Link>
                {line.variantCount > 1 && <p className="line-variant">{line.variantNameBn}</p>}
                <p className="line-unit">{formatTaka(line.pricePaisa)} × {formatNumberBn(line.quantity)}</p>
                <LineIssue line={line} />
                <div className="line-actions">
                  {line.available && <form action={updateCartItemAction} className="quantity-stepper">
                    <input type="hidden" name="itemId" value={line.id} />
                    <button type="submit" name="quantity" value={line.quantity - 1} aria-label="একটি কমান"><Minus size={14} /></button>
                    <span aria-label="পরিমাণ">{formatNumberBn(line.quantity)}</span>
                    <button type="submit" name="quantity" value={line.quantity + 1} aria-label="একটি বাড়ান" disabled={line.quantity >= max}><Plus size={14} /></button>
                  </form>}
                  <form action={removeCartItemAction}>
                    <input type="hidden" name="itemId" value={line.id} />
                    <button type="submit" className="line-remove"><Trash2 size={14} /> সরিয়ে দিন</button>
                  </form>
                </div>
              </div>
              <p className="line-total">{line.available ? formatTaka(line.lineTotalPaisa) : "—"}</p>
            </li>;
          })}
        </ul>

        <aside className="cart-summary">
          <h2>হিসাব</h2>
          <dl>
            <div><dt>পণ্যের দাম</dt><dd>{formatTaka(cart.subtotalPaisa)}</dd></div>
            <div><dt>ডেলিভারি চার্জ</dt><dd className="muted">ঠিকানা দিলে হিসাব হবে</dd></div>
          </dl>
          <p className="summary-note">দাম ও স্টক অর্ডার করার সময় আবার যাচাই করা হবে।</p>
          {cart.hasIssues && <p className="line-issue">কিছু পণ্যে সমস্যা আছে; ঠিক করে নিন।</p>}
          {cart.hasIssues ? <button type="button" disabled>অর্ডার করুন</button> : <Link href="/checkout" className="checkout-link">অর্ডার করুন</Link>}
          <Link href="/#products" className="continue-link">আরও কেনাকাটা করুন</Link>
        </aside>
      </div>}
    </div>
  </div></div>;
}
