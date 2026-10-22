import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactLinks } from "@/components/contact-links";
import { getOrderConfirmation } from "@/lib/checkout";
import { formatNumberBn, formatTaka } from "@/lib/format";
import { shopContact } from "@/lib/shop-contact";

export const metadata: Metadata = { title: "অর্ডার নিশ্চিত হয়েছে", robots: { index: false } };

const maskPhone = (phone: string) => `${phone.slice(0, 3)}****${phone.slice(-4)}`;
const toBnDigits = (value: string) => value.replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]);

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderConfirmation(id);
  if (!order) notFound();

  return <div className="shop-background"><div className="container-shell">
    <div className="cart-page order-confirmation">
      <CircleCheck size={56} strokeWidth={1.2} className="confirm-icon" />
      <h1>ধন্যবাদ, {order.customerName}!</h1>
      <p className="confirm-lead">আপনার অর্ডার আমরা পেয়েছি। শিগগিরই <strong>{toBnDigits(maskPhone(order.customerPhone))}</strong> নম্বরে ফোন করে নিশ্চিত করা হবে।</p>
      <p className="order-number">অর্ডার নম্বর: <strong>{order.orderNumber}</strong></p>

      <div className="confirm-grid">
        <section>
          <h2>পণ্য</h2>
          <ul className="checkout-items-list">{order.items.map(item => <li key={item.id}>
            <span>{item.productNameBn}{item.variantNameBn !== "সাধারণ" && ` (${item.variantNameBn})`} × {formatNumberBn(item.quantity)}</span>
            <span>{formatTaka(item.lineTotalPaisa)}</span>
          </li>)}</ul>
          <dl className="confirm-totals">
            <div><dt>পণ্যের দাম</dt><dd>{formatTaka(order.subtotalPaisa)}</dd></div>
            <div><dt>ডেলিভারি চার্জ ({order.deliveryZoneNameBn})</dt><dd>{formatTaka(order.deliveryFeePaisa)}</dd></div>
            {order.giftWrap && <div><dt>গিফট র‍্যাপ</dt><dd>{formatTaka(order.giftWrapFeePaisa)}</dd></div>}
            {order.discountPaisa > 0 && <div><dt>ছাড়</dt><dd>−{formatTaka(order.discountPaisa)}</dd></div>}
            <div className="summary-total"><dt>পণ্য হাতে পেয়ে দেবেন</dt><dd>{formatTaka(order.totalPaisa)}</dd></div>
          </dl>
        </section>
        <section>
          <h2>ডেলিভারির ঠিকানা</h2>
          <p className="confirm-address">{order.shippingAddress}</p>
          {order.giftWrap && <p className="confirm-gift">উপহার হিসেবে মুড়িয়ে পাঠানো হবে।{order.giftMessage && <> বার্তা: “{order.giftMessage}”</>}</p>}
          <p className="summary-note">পেমেন্ট: ক্যাশ অন ডেলিভারি। অর্ডার নম্বরটি সংরক্ষণ করে রাখুন।</p>
        </section>
      </div>
      {shopContact.hasAny && <section className="confirm-contact"><h2>কোনো প্রশ্ন থাকলে</h2><p>অর্ডার নম্বর <strong>{order.orderNumber}</strong> জানিয়ে যোগাযোগ করুন।</p><ContactLinks /></section>}
      <Link href="/#products" className="continue-link">আরও কেনাকাটা করুন</Link>
    </div>
  </div></div>;
}
