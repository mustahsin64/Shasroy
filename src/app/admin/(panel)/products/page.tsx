import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/product-card";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { listProductsForAdmin } from "@/lib/admin/products";
import { formatDateTimeBn, formatNumberBn, formatTaka } from "@/lib/format";

export const metadata: Metadata = { title: "পণ্য" };

const statusLabels = { draft: "খসড়া", active: "চালু", archived: "আর্কাইভ" } as const;
type Status = keyof typeof statusLabels;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin("manager");
  const params = await searchParams;
  const status = schema.productStatus.enumValues.includes(params.status as Status) ? (params.status as Status) : undefined;
  const query = params.q?.trim().slice(0, 80) || undefined;
  const rows = await listProductsForAdmin({ status, query });

  return <>
    <div className="admin-heading"><h1>পণ্য</h1><Link href="/admin/products/new" className="admin-button">+ নতুন পণ্য</Link></div>
    <form className="admin-filter" action="/admin/products">
      <input name="q" placeholder="নাম বা স্লাগ দিয়ে খুঁজুন" defaultValue={query} />
      <select name="status" defaultValue={status ?? ""}><option value="">সব অবস্থা</option>{schema.productStatus.enumValues.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>
      <button type="submit">খুঁজুন</button>
    </form>
    {rows.length === 0 ? <p className="admin-empty">কোনো পণ্য নেই।</p> : <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th></th><th>পণ্য</th><th>বিভাগ</th><th>দাম</th><th>স্টক</th><th>ধরন</th><th>অবস্থা</th><th>হালনাগাদ</th></tr></thead>
      <tbody>{rows.map(p => <tr key={p.id}>
        <td className="thumb"><ProductImage path={p.imagePath} alt="" sizes="48px" /></td>
        <td><Link href={`/admin/products/${p.id}`}>{p.nameBn}</Link><br /><small>{p.slug}</small></td>
        <td>{p.categoryNameBn}</td>
        <td>{p.minPrice === null ? "—" : formatTaka(p.minPrice)}</td>
        <td className={p.stock <= 5 ? "warn" : undefined}>{formatNumberBn(p.stock)}</td>
        <td>{formatNumberBn(p.variantCount)}</td>
        <td><span className={`status-pill product-${p.status}`}>{statusLabels[p.status]}</span></td>
        <td><small>{formatDateTimeBn(p.updatedAt)}</small></td>
      </tr>)}</tbody>
    </table></div>}
  </>;
}
