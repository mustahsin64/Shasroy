import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderForAdmin, orderStatusLabels, orderTransitions } from "@/lib/admin/orders";
import { formatDateTimeBn, formatNumberBn, formatTaka } from "@/lib/format";
import { StatusForm } from "../status-form";

export const metadata: Metadata = { title: "অর্ডারের বিস্তারিত" };

const paymentLabels = { unpaid: "বাকি", paid: "পরিশোধিত", refunded: "ফেরত", failed: "ব্যর্থ" } as const;

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("staff");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getOrderForAdmin(id);
  if (!order) notFound();
  const next = orderTransitions[order.status];

  return <>
    <p className="admin-back"><Link href="/admin/orders">← সব অর্ডার</Link></p>
    <div className="admin-heading">
      <h1>{order.orderNumber}</h1>
      <span className={`status-pill status-${order.status}`}>{orderStatusLabels[order.status]}</span>
    </div>
    <p className="admin-muted">{formatDateTimeBn(order.createdAt)} · ক্যাশ অন ডেলিভারি · পেমেন্ট: {paymentLabels[order.paymentStatus]}</p>

    <div className="admin-columns">
      <section className="admin-card">
        <h2>পণ্য</h2>
        <table className="admin-table compact">
          <thead><tr><th>পণ্য</th><th>কোড</th><th>দাম</th><th>পরিমাণ</th><th>মোট</th></tr></thead>
          <tbody>{order.items.map(item => <tr key={item.id}>
            <td>{item.productNameBn}<br /><small>{item.variantNameBn}</small></td>
            <td><small>{item.sku}</small></td>
            <td>{formatTaka(item.unitPricePaisa)}</td>
            <td>{formatNumberBn(item.quantity)}</td>
            <td>{formatTaka(item.lineTotalPaisa)}</td>
          </tr>)}</tbody>
        </table>
        <dl className="admin-totals">
          <div><dt>পণ্যের দাম</dt><dd>{formatTaka(order.subtotalPaisa)}</dd></div>
          <div><dt>ডেলিভারি ({order.deliveryZoneNameBn})</dt><dd>{formatTaka(order.deliveryFeePaisa)}</dd></div>
          {order.discountPaisa > 0 && <div><dt>ছাড়</dt><dd>−{formatTaka(order.discountPaisa)}</dd></div>}
          <div className="grand"><dt>আদায় করতে হবে</dt><dd>{formatTaka(order.totalPaisa)}</dd></div>
        </dl>
      </section>

      <div>
        <section className="admin-card">
          <h2>গ্রাহক</h2>
          <p><strong>{order.customerName}</strong></p>
          <p><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>{order.customerEmail && <> · {order.customerEmail}</>}</p>
          <p className="admin-address">{order.shippingAddress}</p>
          {order.customerNote && <p className="admin-note">নির্দেশনা: {order.customerNote}</p>}
        </section>

        <section className="admin-card">
          <h2>অবস্থা বদলান</h2>
          {next.length === 0 ? <p className="admin-muted">এই অর্ডারে আর কোনো ধাপ নেই।</p> :
            <StatusForm orderId={order.id} options={next.map(s => ({ value: s, label: s === "cancelled" ? "বাতিল করুন" : `${orderStatusLabels[s]} করুন`, danger: s === "cancelled" }))} />}
        </section>

        <section className="admin-card">
          <h2>ইতিহাস</h2>
          <ol className="admin-history">{order.statusHistory.map(h => <li key={h.id}>
            <strong>{h.fromStatus ? `${orderStatusLabels[h.fromStatus]} → ` : ""}{orderStatusLabels[h.toStatus]}</strong>
            <small>{formatDateTimeBn(h.createdAt)}{h.changedByAdmin ? ` · ${h.changedByAdmin.displayName ?? h.changedByAdmin.email}` : " · গ্রাহক"}</small>
            {h.note && <span>{h.note}</span>}
          </li>)}</ol>
        </section>
      </div>
    </div>
  </>;
}
