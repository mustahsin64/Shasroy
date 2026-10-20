import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getVariantHistory, movementReasonLabels, type MovementReason } from "@/lib/admin/inventory";
import { formatDateTimeBn, formatNumberBn } from "@/lib/format";

export const metadata: Metadata = { title: "স্টকের ইতিহাস" };

export default async function VariantHistoryPage({ params, searchParams }: { params: Promise<{ id: string; variantId: string }>; searchParams: Promise<{ reason?: string; page?: string }> }) {
  await requireAdmin("manager");
  const [{ id, variantId }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(variantId).success) notFound();
  const reason = schema.inventoryReason.enumValues.includes(query.reason as MovementReason) ? (query.reason as MovementReason) : undefined;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const history = await getVariantHistory(id, variantId, reason, page);
  if (!history) notFound();
  const { variant, rows, total, pageSize } = history;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (r?: string, p?: number) => `/admin/products/${id}/variants/${variantId}/history?${new URLSearchParams({ ...(r ? { reason: r } : {}), ...(p && p > 1 ? { page: String(p) } : {}) })}`;

  return <>
    <p className="admin-back"><Link href={`/admin/products/${id}`}>← {variant.product.nameBn}</Link></p>
    <h1>স্টকের ইতিহাস</h1>
    <p className="admin-muted"><strong>{variant.nameBn}</strong> · কোড {variant.sku} · বর্তমান স্টক: <strong>{formatNumberBn(variant.stockQuantity)}</strong></p>
    <nav className="admin-tabs" aria-label="কারণ অনুযায়ী">
      <Link href={href()} aria-current={!reason ? "page" : undefined}>সব</Link>
      {schema.inventoryReason.enumValues.map(r => <Link key={r} href={href(r)} aria-current={reason === r ? "page" : undefined}>{movementReasonLabels[r]}</Link>)}
    </nav>
    <p className="admin-muted">এখানে শুধু পরিবর্তনগুলো (+/−) দেখানো হয়; ইতিহাস যত দূর রেকর্ড করা আছে তত দূরই।</p>
    {rows.length === 0 ? <p className="admin-empty">কোনো রেকর্ড নেই।</p> : <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>সময়</th><th>পরিবর্তন</th><th>কারণ</th><th>কে</th><th>অর্ডার</th><th>নোট</th></tr></thead>
      <tbody>{rows.map(m => <tr key={m.id}>
        <td>{formatDateTimeBn(m.createdAt)}</td>
        <td className={m.change < 0 ? "warn" : undefined}><strong>{m.change > 0 ? "+" : "−"}{formatNumberBn(Math.abs(m.change))}</strong></td>
        <td>{movementReasonLabels[m.reason]}</td>
        <td>{m.createdByAdmin ? (m.createdByAdmin.displayName ?? m.createdByAdmin.email) : "সিস্টেম / গ্রাহক"}</td>
        <td>{m.order ? <Link href={`/admin/orders/${m.order.id}`}>{m.order.orderNumber}</Link> : "—"}</td>
        <td>{m.note ?? "—"}</td>
      </tr>)}</tbody>
    </table></div>}
    {pages > 1 && <nav className="admin-pager">
      {page > 1 && <Link href={href(reason, page - 1)}>← আগের</Link>}
      <span>{formatNumberBn(page)} / {formatNumberBn(pages)}</span>
      {page < pages && <Link href={href(reason, page + 1)}>পরের →</Link>}
    </nav>}
  </>;
}
