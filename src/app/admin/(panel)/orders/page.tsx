import type { Metadata } from "next";
import Link from "next/link";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders, orderStatusCounts, orderStatusLabels, type OrderStatus } from "@/lib/admin/orders";
import { formatDateTimeBn, formatNumberBn, formatTaka } from "@/lib/format";

export const metadata: Metadata = { title: "অর্ডার" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin("staff");
  const params = await searchParams;
  const status = schema.orderStatus.enumValues.includes(params.status as OrderStatus) ? (params.status as OrderStatus) : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const [{ rows, total, pageSize }, counts] = await Promise.all([listOrders(status, page), orderStatusCounts()]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (s?: string, p?: number) => `/admin/orders?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(p && p > 1 ? { page: String(p) } : {}) })}`;

  return <>
    <h1>অর্ডার</h1>
    <nav className="admin-tabs" aria-label="অবস্থা অনুযায়ী">
      <Link href={href()} aria-current={!status ? "page" : undefined}>সব</Link>
      {schema.orderStatus.enumValues.map(s => <Link key={s} href={href(s)} aria-current={status === s ? "page" : undefined}>
        {orderStatusLabels[s]} <small>{formatNumberBn(counts[s] ?? 0)}</small>
      </Link>)}
    </nav>
    {rows.length === 0 ? <p className="admin-empty">কোনো অর্ডার নেই।</p> : <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>নম্বর</th><th>সময়</th><th>গ্রাহক</th><th>এলাকা</th><th>পণ্য</th><th>মোট</th><th>অবস্থা</th></tr></thead>
      <tbody>{rows.map(order => <tr key={order.id}>
        <td><Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td>
        <td>{formatDateTimeBn(order.createdAt)}</td>
        <td>{order.customerName}<br /><small>{order.customerPhone}</small></td>
        <td>{order.deliveryZoneNameBn}</td>
        <td>{formatNumberBn(order.itemCount)}</td>
        <td>{formatTaka(order.totalPaisa)}</td>
        <td><span className={`status-pill status-${order.status}`}>{orderStatusLabels[order.status]}</span></td>
      </tr>)}</tbody>
    </table></div>}
    {pages > 1 && <nav className="admin-pager">
      {page > 1 && <Link href={href(status, page - 1)}>← আগের</Link>}
      <span>{formatNumberBn(page)} / {formatNumberBn(pages)}</span>
      {page < pages && <Link href={href(status, page + 1)}>পরের →</Link>}
    </nav>}
  </>;
}
