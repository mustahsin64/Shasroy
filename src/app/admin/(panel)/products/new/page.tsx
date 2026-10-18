import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/admin-auth";
import { listCategoriesForAdmin } from "@/lib/admin/products";
import { createProductAction } from "../actions";
import { ProductFields, VariantFields } from "../product-fields";

export const metadata: Metadata = { title: "নতুন পণ্য" };

export default async function NewProductPage() {
  await requireAdmin("manager");
  const categories = await listCategoriesForAdmin();
  return <>
    <p className="admin-back"><Link href="/admin/products">← সব পণ্য</Link></p>
    <h1>নতুন পণ্য</h1>
    <ActionForm action={createProductAction} submitLabel="পণ্য তৈরি করুন" className="admin-card">
      <ProductFields categories={categories} />
      <h2>প্রথম ধরন ও দাম</h2>
      <p className="admin-muted">রং বা মাপ না থাকলে ধরনের নাম “সাধারণ” রাখুন। পরে আরও ধরন ও ছবি যোগ করা যাবে।</p>
      <VariantFields values={{ variantNameBn: "সাধারণ" }} withStock hideDefault />
    </ActionForm>
  </>;
}
