import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrintControls, type SlipSize } from "@/components/admin/print-controls";
import { requireAdmin } from "@/lib/admin-auth";
import { collectionState, getOrderForPrint } from "@/lib/admin/orders";
import { formatDateTimeBn, formatNumberBn, formatTaka } from "@/lib/format";
import "../../../../print.css";

export const metadata: Metadata = { title: "অর্ডার স্লিপ", robots: { index: false, follow: false } };

export default async function PrintOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ size?: string }> }) {
  await requireAdmin("staff");
  const [{ id }, { size: sizeParam }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getOrderForPrint(id);
  if (!order) notFound();
  const size: SlipSize = sizeParam === "a5" ? "a5" : "a4";
  const collection = collectionState(order);
  const hidePrices = order.giftWrap;

  return <>
    {/* size is one of two fixed literals, never raw input */}
    <style>{`@page { size: ${size === "a5" ? "A5" : "A4"}; margin: 10mm; }`}</style>
    <PrintControls orderId={id} size={size} />
    <article className={`slip slip-${size}`}>
      <header className="slip-head">
        <div className="slip-logo"><Image src="/brand/shasroy-logo.png" alt="সাশ্রয়" fill sizes="160px" className="object-cover object-[center_52%]" /></div>
        <div className="slip-meta">
          <strong className="slip-number">{order.orderNumber}</strong>
          <span>{formatDateTimeBn(order.createdAt)}</span>
        </div>
      </header>

      <section className="slip-block">
        <h2>প্রাপক</h2>
        <p className="slip-name">{order.customerName}</p>
        <p className="slip-phone">{order.customerPhone}</p>
        <p className="slip-address">{order.shippingAddress}</p>
        <p className="slip-zone">এলাকা: {order.deliveryZoneNameBn}</p>
        {order.customerNote && <p className="slip-note">গ্রাহকের নির্দেশনা: {order.customerNote}</p>}
      </section>

      {order.giftWrap && <section className="slip-block slip-gift">
        <h2>উপহার</h2>
        <p>গিফট র‍্যাপ করে পাঠান। প্যাকেটে দামের কোনো কাগজ দেবেন না।</p>
        {order.giftMessage && <p className="slip-gift-message">কার্ডে লিখুন: “{order.giftMessage}”</p>}
      </section>}

      {/* Gift orders: no item prices or breakdown on the slip; only the amount to collect remains. */}
      <table className="slip-items">
        <thead><tr><th>পণ্য</th><th>কোড</th>{!hidePrices && <th className="num">দাম</th>}<th className="num">পরিমাণ</th>{!hidePrices && <th className="num">মোট</th>}</tr></thead>
        <tbody>{order.items.map(item => <tr key={item.id}>
          <td>{item.productNameBn}{item.variantNameBn !== "সাধারণ" && <small> ({item.variantNameBn})</small>}</td>
          <td><small>{item.sku}</small></td>
          {!hidePrices && <td className="num">{formatTaka(item.unitPricePaisa)}</td>}
          <td className="num">{formatNumberBn(item.quantity)}</td>
          {!hidePrices && <td className="num">{formatTaka(item.lineTotalPaisa)}</td>}
        </tr>)}</tbody>
      </table>

      {!hidePrices && <dl className="slip-totals">
        <div><dt>পণ্যের দাম</dt><dd>{formatTaka(order.subtotalPaisa)}</dd></div>
        <div><dt>ডেলিভারি চার্জ</dt><dd>{formatTaka(order.deliveryFeePaisa)}</dd></div>
        {order.discountPaisa > 0 && <div><dt>ছাড়</dt><dd>−{formatTaka(order.discountPaisa)}</dd></div>}
        <div className="slip-grand"><dt>মোট</dt><dd>{formatTaka(order.totalPaisa)}</dd></div>
      </dl>}

      <div className={`slip-collect slip-collect-${collection.kind}`}>
        {collection.kind === "collect" && <>পণ্য হাতে দিয়ে আদায় করুন: <strong>{formatTaka(collection.amountPaisa)}</strong> (ক্যাশ অন ডেলিভারি)</>}
        {collection.kind === "paid" && <>পরিশোধিত: কোনো টাকা আদায় করবেন না।</>}
        {collection.kind === "refunded" && <>টাকা ফেরত হয়েছে: আদায়যোগ্য নয়।</>}
        {collection.kind === "cancelled" && <>বাতিল অর্ডার: ডেলিভারি দেবেন না, টাকা আদায় নয়।</>}
        {collection.kind === "none" && <>টাকা আদায় প্রযোজ্য নয়।</>}
      </div>
    </article>
  </>;
}
