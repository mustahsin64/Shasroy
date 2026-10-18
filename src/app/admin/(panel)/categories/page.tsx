import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/admin-auth";
import { listCategoriesForAdmin } from "@/lib/admin/products";
import { formatNumberBn } from "@/lib/format";
import { deleteCategoryAction, saveCategoryAction } from "./actions";

export const metadata: Metadata = { title: "বিভাগ" };

type Values = { nameBn?: string; slug?: string; descriptionBn?: string | null; sortOrder?: number; isActive?: boolean };

function CategoryFields({ values = {} }: { values?: Values }) {
  return <div className="admin-grid">
    <label>নাম *<input name="nameBn" required maxLength={120} defaultValue={values.nameBn} /></label>
    <label>স্লাগ *<input name="slug" required maxLength={80} placeholder="stationery" defaultValue={values.slug} /></label>
    <label>ক্রম<input name="sortOrder" inputMode="numeric" defaultValue={values.sortOrder ?? 0} /><small>ছোট সংখ্যা আগে দেখাবে</small></label>
    <label className="checkbox"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> দোকানে দেখান</label>
    <label className="span-2">বিবরণ (ঐচ্ছিক)<input name="descriptionBn" maxLength={1000} defaultValue={values.descriptionBn ?? ""} /></label>
  </div>;
}

export default async function AdminCategoriesPage() {
  await requireAdmin("manager");
  const categories = await listCategoriesForAdmin();
  return <>
    <h1>বিভাগ</h1>
    {categories.map(c => <details key={c.id} className="admin-card admin-collapsible">
      <summary><strong>{c.nameBn}</strong> <small>{c.slug} · {formatNumberBn(c.productCount)}টি পণ্য{!c.isActive && " · বন্ধ"}</small></summary>
      <ActionForm action={saveCategoryAction} submitLabel="সংরক্ষণ করুন">
        <input type="hidden" name="categoryId" value={c.id} />
        <CategoryFields values={c} />
      </ActionForm>
      {c.productCount === 0 && <ActionForm action={deleteCategoryAction} submitLabel="বিভাগ মুছুন" className="inline" danger confirmText="বিভাগটি মুছে ফেলবেন?">
        <input type="hidden" name="categoryId" value={c.id} />
      </ActionForm>}
    </details>)}
    <section className="admin-card">
      <h2>নতুন বিভাগ</h2>
      <ActionForm action={saveCategoryAction} submitLabel="বিভাগ যোগ করুন"><CategoryFields /></ActionForm>
    </section>
  </>;
}
