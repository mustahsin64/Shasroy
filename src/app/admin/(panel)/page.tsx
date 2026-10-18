import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireAdmin } from "@/lib/admin-auth";
import { listOrders, orderStatusCounts, orderStatusLabels } from "@/lib/admin/orders";
import { lowStockVariants } from "@/lib/admin/products";
import { formatDateTimeBn, formatNumberBn, formatTaka } from "@/lib/format";

export const metadata: Metadata = { title: "ড্যাশবোর্ড" };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const admin = await requireAdmin();
  const { denied } = await searchParams;
  const [counts, recent, lowStock] = await Promise.all([orderStatusCounts(), listOrders("pending"), hasRole(admin, "manager") ? lowStockVariants() : Promise.resolve([])]);
  const open = (counts.pending ?? 0) + (counts.confirmed ?? 0) + (counts.processing ?? 0) + (counts.shipped ?? 0);

  return <>
    <h1>ড্যাশবোর্ড</h1>
    {denied && <p className="admin-error">এই পাতাটি দেখার অনুমতি আপনার নেই।</p>}
    <div className="admin-stats">
      <Link href="/admin/orders?status=pending"><strong>{formatNumberBn(counts.pending ?? 0)}</strong><span>নতুন অর্ডার</span></Link>
      <Link href="/admin/orders"><strong>{formatNumberBn(open)}</strong><span>চলমান অর্ডার</span></Link>
      <Link href="/admin/orders?status=delivered"><strong>{formatNumberBn(counts.delivered ?? 0)}</strong><span>ডেলিভারি সম্পন্ন</span></Link>
      {hasRole(admin, "manager") && <Link href="/admin/products"><strong>{formatNumberBn(lowStock.length)}</strong><span>কম স্টকের ধরন</span></Link>}
    </div>

    <section className="admin-card">
      <h2>নতুন অর্ডার ({orderStatusLabels.pending})</h2>
      {recent.rows.length === 0 ? <p className="admin-muted">নতুন অর্ডার নেই।</p> : <ul className="admin-list">{recent.rows.slice(0, 10).map(o => <li key={o.id}>
        <Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link> · {o.customerName} · {formatTaka(o.totalPaisa)} <small>{formatDateTimeBn(o.createdAt)}</small>
      </li>)}</ul>}
    </section>

    {lowStock.length > 0 && <section className="admin-card">
      <h2>কম স্টক (৫ বা কম)</h2>
      <ul className="admin-list">{lowStock.map(v => <li key={v.sku}>
        <Link href={`/admin/products/${v.productId}`}>{v.productNameBn}</Link> · {v.variantNameBn} <small>({v.sku})</small> · <strong className={v.stock === 0 ? "warn" : undefined}>{formatNumberBn(v.stock)}টি</strong>
      </li>)}</ul>
    </section>}
  </>;
}
